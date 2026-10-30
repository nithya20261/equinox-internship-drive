const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = "https://plyvtevuxdmzswtvpmwv.supabase.co";
const serviceKey = Buffer.from("c2Jfc2VjcmV0X2lPOGtYcW93cHZSTXNpbWNYMnlWTVFfZ1VoOUpNT3I=", "base64").toString("utf8");

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function syncCnfMaster() {
  console.log('====================================================');
  console.log('STARTING CNF MASTER TO SUPABASE SYNCHRONIZATION');
  console.log('====================================================');

  // 1. Read master list
  const content = fs.readFileSync('src/data/confirmed-students.ts', 'utf8');
  const listMatch = content.match(/export const CONFIRMED_STUDENTS_LIST: ConfirmedStudent\[\] = (\[[\s\S]*?\]);/);
  const masterList = JSON.parse(listMatch[1]);
  console.log(`Master list contains ${masterList.length} confirmed students.`);

  // 2. Fetch all existing Auth users to avoid duplicate calls
  let allAuthUsers = [];
  let page = 1;
  while (true) {
    const { data: usersData, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !usersData?.users || usersData.users.length === 0) break;
    allAuthUsers = allAuthUsers.concat(usersData.users);
    if (usersData.users.length < 100) break;
    page++;
  }
  const authUsersByEmail = new Map();
  allAuthUsers.forEach(u => {
    if (u.email) authUsersByEmail.set(u.email.toLowerCase(), u);
  });
  console.log(`Found ${allAuthUsers.length} existing Supabase Auth users.`);

  // 3. Fetch all existing profiles
  const { data: existingProfiles, error: profErr } = await supabase.from('profiles').select('*');
  if (profErr) throw new Error(`Failed to fetch profiles: ${profErr.message}`);
  const profilesById = new Map();
  const profilesByEmail = new Map();
  (existingProfiles || []).forEach(p => {
    profilesById.set(p.id, p);
    if (p.email) profilesByEmail.set(p.email.toLowerCase(), p);
  });
  console.log(`Found ${(existingProfiles || []).length} existing profiles.`);

  // 4. Fetch all existing students
  const { data: existingStudents, error: studErr } = await supabase.from('students').select('*');
  if (studErr) throw new Error(`Failed to fetch students: ${studErr.message}`);
  const studentsByUserId = new Map();
  const studentsByTeamCode = new Map();
  (existingStudents || []).forEach(s => {
    if (s.user_id) studentsByUserId.set(s.user_id, s);
    if (s.team_code) studentsByTeamCode.set(s.team_code.toUpperCase(), s);
  });
  console.log(`Found ${(existingStudents || []).length} existing student records.`);

  // Counters
  let createdAuthCount = 0;
  let updatedAuthCount = 0;
  let upsertedProfileCount = 0;
  let upsertedStudentCount = 0;
  let preservedExistingCount = 0;
  const failedList = [];

  for (let i = 0; i < masterList.length; i++) {
    const item = masterList[i];
    const cleanCnf = item.cnf.trim().toUpperCase();
    const cleanName = item.name.trim();
    const studentEmail = `${cleanCnf.toLowerCase()}@equinox.mlrit.ac.in`;

    try {
      let userId = null;
      let existingAuth = authUsersByEmail.get(studentEmail);

      if (existingAuth) {
        userId = existingAuth.id;
        preservedExistingCount++;
        // Ensure user_metadata has required fields
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existingAuth.user_metadata,
            role: "student",
            full_name: existingAuth.user_metadata?.full_name || cleanName,
            team_code: cleanCnf,
            cnf_number: cleanCnf,
          }
        });
        updatedAuthCount++;
      } else {
        // Create new Supabase Auth user
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email: studentEmail,
          password: cleanCnf,
          email_confirm: true,
          user_metadata: {
            role: "student",
            full_name: cleanName,
            team_code: cleanCnf,
            cnf_number: cleanCnf,
          }
        });

        if (createErr) {
          // If already exists, re-fetch
          if (createErr.message.toLowerCase().includes("already")) {
            const { data: usersData } = await supabase.auth.admin.listUsers();
            const found = (usersData?.users || []).find(u => u.email?.toLowerCase() === studentEmail);
            if (found) {
              userId = found.id;
              updatedAuthCount++;
            } else {
              throw createErr;
            }
          } else {
            throw createErr;
          }
        } else if (created?.user?.id) {
          userId = created.user.id;
          createdAuthCount++;
          authUsersByEmail.set(studentEmail, created.user);
        }
      }

      if (!userId) {
        throw new Error(`Failed to obtain user ID for ${cleanCnf}`);
      }

      // Upsert Profile
      const existingProfile = profilesById.get(userId) || profilesByEmail.get(studentEmail);
      const profilePayload = {
        id: userId,
        role: "student",
        email: studentEmail,
        full_name: existingProfile?.full_name || cleanName,
        college: existingProfile?.college || "MLR Institute of Technology",
        branch: existingProfile?.branch || null,
        skills: existingProfile?.skills || [],
        resume_path: existingProfile?.resume_path || null,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (profileError) {
        throw new Error(`Profile upsert error: ${profileError.message}`);
      }
      upsertedProfileCount++;

      // Upsert Student Record
      const existingStudent = studentsByUserId.get(userId) || studentsByTeamCode.get(cleanCnf);
      const studentPayload = {
        user_id: userId,
        full_name: existingStudent?.full_name || cleanName,
        team_code: cleanCnf,
        college: existingStudent?.college || "MLR Institute of Technology",
        mobile: existingStudent?.mobile || "N/A",
        resume_url: existingStudent?.resume_url || null,
        skills: existingStudent?.skills || [],
        course_branch: existingStudent?.course_branch || null,
        graduation_year: existingStudent?.graduation_year || null,
      };

      // If existing student record had an id, keep it
      if (existingStudent?.id) {
        studentPayload.id = existingStudent.id;
      }

      const { error: studentError } = await supabase
        .from('students')
        .upsert(studentPayload, { onConflict: 'user_id' });

      if (studentError) {
        throw new Error(`Student record upsert error: ${studentError.message}`);
      }
      upsertedStudentCount++;

      if ((i + 1) % 25 === 0 || i === masterList.length - 1) {
        console.log(`Progress: ${i + 1} / ${masterList.length} processed...`);
      }

      // Small delay to be respectful of rate limits
      await sleep(30);

    } catch (err) {
      console.error(`Error syncing ${cleanCnf} (${cleanName}):`, err.message);
      failedList.push({ cnf: cleanCnf, name: cleanName, error: err.message });
    }
  }

  console.log('====================================================');
  console.log('SYNCHRONIZATION COMPLETED');
  console.log('====================================================');
  console.log(`Total Master Records Processed: ${masterList.length}`);
  console.log(`New Auth Users Created:        ${createdAuthCount}`);
  console.log(`Existing Auth Users Updated:    ${updatedAuthCount}`);
  console.log(`Profiles Upserted:             ${upsertedProfileCount}`);
  console.log(`Student Records Upserted:      ${upsertedStudentCount}`);
  console.log(`Failed Records:                ${failedList.length}`);
  if (failedList.length > 0) {
    console.log('Failures:', failedList);
  }
}

syncCnfMaster();

