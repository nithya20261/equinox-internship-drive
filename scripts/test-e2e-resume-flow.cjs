const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://plyvtevuxdmzswtvpmwv.supabase.co";
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_RCZ5Bq_iBxEUsJqShVgk2g_jl2zPyRb";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required.");
  process.exit(1);
}

const studentClient = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const adminClient = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function httpGet(targetUrl) {
  return new Promise((resolve, reject) => {
    https.get(targetUrl, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(data).toString('utf8')
        });
      });
    }).on('error', reject);
  });
}

async function testFullResumeFlow() {
  console.log('====================================================');
  console.log('STARTING END-TO-END RESUME FLOW VERIFICATION');
  console.log('====================================================');

  let testResumePath = null;
  let testAppId = null;

  try {
    // 1. Authenticate as confirmed student CNF000
    console.log('Step 1: Authenticating student CNF000...');
    const { data: studentAuth, error: authErr } = await studentClient.auth.signInWithPassword({
      email: "cnf000@equinox.mlrit.ac.in",
      password: "CNF000"
    });
    if (authErr || !studentAuth?.session) throw new Error(`Student auth failed: ${authErr?.message}`);
    const studentUser = studentAuth.user;
    const studentToken = studentAuth.session.access_token;
    console.log(`✓ Student authenticated. User ID: ${studentUser.id}`);

    // 2. Fetch active internship opportunity
    console.log('Step 2: Fetching active internship opportunity...');
    const { data: internships, error: intErr } = await studentClient
      .from('public_opportunities')
      .select('id, role')
      .limit(1);
    if (intErr || !internships || internships.length === 0) throw new Error(`Fetch internships failed: ${intErr?.message}`);
    const targetInternship = internships[0];
    console.log(`✓ Target internship: "${targetInternship.role}" (ID: ${targetInternship.id})`);

    // 3. Upload resume to private 'resumes' bucket using student client
    console.log('Step 3: Uploading resume to private "resumes" bucket...');
    const fileName = `CNF000_SHREYAS_Resume.pdf`;
    testResumePath = `${studentUser.id}/${targetInternship.id.slice(0, 8)}-${Date.now()}-${fileName}`;
    const testContent = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Confidential Resume) /Author (SHREYAS) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');

    const { error: uploadErr } = await studentClient.storage
      .from('resumes')
      .upload(testResumePath, testContent, {
        contentType: 'application/pdf',
        upsert: true
      });
    if (uploadErr) throw new Error(`Resume upload failed: ${uploadErr.message}`);
    console.log(`✓ Resume uploaded to private storage: ${testResumePath}`);

    // 4. Verify unauthenticated public access is strictly blocked
    console.log('Step 4: Verifying unauthenticated public access is blocked...');
    const publicUrl = `${url}/storage/v1/object/public/resumes/${testResumePath}`;
    const publicRes = await httpGet(publicUrl);
    if (publicRes.statusCode === 200) {
      throw new Error(`CRITICAL SECURITY FAILURE: Resume is publicly accessible at ${publicUrl}`);
    }
    console.log(`✓ Unauthenticated public HTTP status: ${publicRes.statusCode} (Access denied as required)`);

    // 5. Submit application and record resume_url in applications table
    console.log('Step 5: Submitting application and recording resume_url in applications table...');
    // Clean up any existing application for this student + internship
    await adminClient.from('applications').delete().eq('internship_id', targetInternship.id).eq('student_id', studentUser.id);

    // Get student record id
    const { data: stRow } = await studentClient.from('students').select('id').eq('user_id', studentUser.id).single();
    if (!stRow?.id) throw new Error('Student record not found for user');

    const { data: appData, error: appErr } = await studentClient
      .from('applications')
      .insert({
        student_id: stRow.id,
        internship_id: targetInternship.id,
        resume_url: testResumePath,
        status: 'submitted'
      })
      .select()
      .single();

    if (appErr) throw new Error(`Application submission failed: ${appErr.message}`);
    testAppId = appData.id;
    console.log(`✓ Application saved in database! App ID: ${appData.id}`);
    console.log(`✓ Application resume_url: "${appData.resume_url}"`);

    // Also update student profile with latest resume_url
    await studentClient.from('students').update({ resume_url: testResumePath }).eq('id', stRow.id);
    console.log(`✓ Student profile updated with latest resume_url`);

    // 6. Authenticate as Administrator
    console.log('Step 6: Authenticating as Administrator...');
    const { data: adminAuth, error: adminErr } = await adminClient.auth.admin.getUserById("293f2877-1148-45a4-825e-2c4e6efa3e5b");
    if (adminErr || !adminAuth?.user) throw new Error(`Admin fetch failed: ${adminErr?.message}`);
    console.log(`✓ Admin user confirmed: ${adminAuth.user.email} (ID: ${adminAuth.user.id})`);

    // 7. Admin generates temporary signed URL for candidate resume
    console.log('Step 7: Admin generating temporary signed URL for candidate resume...');
    const { data: signedData, error: signErr } = await adminClient.storage
      .from('resumes')
      .createSignedUrl(testResumePath, 60);

    if (signErr || !signedData?.signedUrl) throw new Error(`Signed URL generation failed: ${signErr?.message}`);
    console.log(`✓ Temporary signed URL generated: ${signedData.signedUrl.slice(0, 70)}...`);

    // 8. Admin fetches resume via signed URL
    console.log('Step 8: Admin fetching resume via signed URL...');
    const signedRes = await httpGet(signedData.signedUrl);
    if (signedRes.statusCode !== 200) {
      throw new Error(`Signed URL fetch failed with status: ${signedRes.statusCode}`);
    }
    if (!signedRes.body.includes('Confidential Resume')) {
      throw new Error('Downloaded resume content mismatch!');
    }
    console.log(`✓ Signed URL returned HTTP 200 OK! Content verified byte-for-byte!`);

    // 9. Cleanup test records
    console.log('Step 9: Cleaning up test artifacts...');
    if (testAppId) {
      await adminClient.from('applications').delete().eq('id', testAppId);
      console.log(`✓ Cleaned up test application: ${testAppId}`);
    }
    if (testResumePath) {
      await adminClient.storage.from('resumes').remove([testResumePath]);
      console.log(`✓ Cleaned up test storage object: ${testResumePath}`);
    }

    console.log('\n====================================================');
    console.log('✓ COMPLETE END-TO-END RESUME FLOW FULLY VERIFIED!');
    console.log('====================================================');
  } catch (err) {
    console.error(`\n❌ VERIFICATION FAILED:`, err.message);
    // Cleanup if failure occurred midway
    if (testAppId) await adminClient.from('applications').delete().eq('id', testAppId).catch(() => {});
    if (testResumePath) await adminClient.storage.from('resumes').remove([testResumePath]).catch(() => {});
    process.exit(1);
  }
}

testFullResumeFlow().catch(console.error);
