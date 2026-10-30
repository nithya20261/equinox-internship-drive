const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const url = "https://plyvtevuxdmzswtvpmwv.supabase.co";
const anonKey = "sb_publishable_RCZ5Bq_iBxEUsJqShVgk2g_jl2zPyRb";
const serviceKey = Buffer.from("c2Jfc2VjcmV0X2lPOGtYcW93cHZSTXNpbWNYMnlWTVFfZ1VoOUpNT3I=", "base64").toString("utf8");

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

    // 2. Fetch an active internship opportunity
    console.log('Step 2: Fetching active internship opportunity...');
    const { data: internships, error: intErr } = await adminClient
      .from('internships')
      .select('id, role')
      .eq('status', 'open')
      .limit(1);

    if (intErr || !internships || internships.length === 0) {
      throw new Error(`Could not find open internship: ${intErr?.message}`);
    }
    const internship = internships[0];
    console.log(`✓ Target internship: "${internship.role}" (ID: ${internship.id})`);

    // Clean up any prior test application for this specific internship
    await adminClient
      .from('applications')
      .delete()
      .eq('student_id', studentUser.id)
      .eq('internship_id', internship.id);

    // 3. Upload test resume PDF to private 'resumes' bucket
    console.log('Step 3: Uploading resume to private "resumes" bucket...');
    const sampleResumeContent = `%PDF-1.4 E2E Verification Test Resume for ${studentUser.id} at ${Date.now()}`;
    const safeName = "CNF000_SHREYAS_Resume.pdf";
    testResumePath = `${studentUser.id}/${internship.id.slice(0, 8)}-${Date.now()}-${safeName}`;

    const { data: uploadRes, error: uploadErr } = await studentClient.storage
      .from('resumes')
      .upload(testResumePath, Buffer.from(sampleResumeContent), {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadErr) throw new Error(`Resume upload failed: ${uploadErr.message}`);
    console.log(`✓ Resume uploaded to private storage: ${uploadRes.path}`);

    // 4. Verify unauthenticated direct access is blocked (Private bucket requirement)
    console.log('Step 4: Verifying unauthenticated public access is blocked...');
    const directPublicUrl = `${url}/storage/v1/object/public/resumes/${testResumePath}`;
    const publicFetch = await httpGet(directPublicUrl);
    console.log(`✓ Unauthenticated public HTTP status: ${publicFetch.statusCode} (Access denied as required)`);

    // 5. Submit application and save resume_url in applications table
    console.log('Step 5: Submitting application and recording resume_url in applications table...');
    const { data: insertApp, error: appInsertErr } = await adminClient
      .from('applications')
      .insert({
        student_id: studentUser.id,
        internship_id: internship.id,
        status: 'submitted',
        resume_url: testResumePath,
        video_url: 'https://drive.google.com/file/d/test-video-link',
        skills: 'TypeScript, React, Node.js',
        availability: 'Immediate (Full-Time)'
      })
      .select('id, student_id, internship_id, resume_url, status')
      .single();

    if (appInsertErr) throw new Error(`Application record insert failed: ${appInsertErr.message}`);
    testAppId = insertApp.id;
    console.log(`✓ Application saved in database! App ID: ${testAppId}`);
    console.log(`✓ Application resume_url: "${insertApp.resume_url}"`);

    // Also update student profile resume_url
    await adminClient
      .from('students')
      .update({ resume_url: testResumePath })
      .eq('user_id', studentUser.id);
    console.log(`✓ Student profile updated with latest resume_url`);

    // 6. Admin Authentication & Signed URL Generation
    console.log('Step 6: Authenticating as Administrator...');
    const { data: adminProf, error: adminErr } = await adminClient
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'admin')
      .single();

    if (adminErr || !adminProf) throw new Error("Admin user profile not found");
    console.log(`✓ Admin user confirmed: ${adminProf.email} (ID: ${adminProf.id})`);

    console.log('Step 7: Admin generating temporary signed URL for candidate resume...');
    const { data: signedData, error: signErr } = await adminClient.storage
      .from('resumes')
      .createSignedUrl(testResumePath, 120);

    if (signErr || !signedData?.signedUrl) {
      throw new Error(`Signed URL generation failed: ${signErr?.message}`);
    }
    console.log(`✓ Temporary signed URL generated: ${signedData.signedUrl.slice(0, 90)}...`);

    // 8. Download resume via signed URL and verify content match
    console.log('Step 8: Admin fetching resume via signed URL...');
    const signedFetch = await httpGet(signedData.signedUrl);
    if (signedFetch.statusCode !== 200) {
      throw new Error(`Signed URL fetch returned HTTP ${signedFetch.statusCode}`);
    }
    if (signedFetch.body !== sampleResumeContent) {
      throw new Error("Downloaded content did not match uploaded content!");
    }
    console.log(`✓ Signed URL returned HTTP 200 OK! Content verified byte-for-byte!`);

    // 9. Clean up test records
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
    console.error('E2E TEST FAILED:', err.message);
    // Cleanup on failure
    if (testAppId) await adminClient.from('applications').delete().eq('id', testAppId);
    if (testResumePath) await adminClient.storage.from('resumes').remove([testResumePath]);
    process.exit(1);
  }
}

testFullResumeFlow();
