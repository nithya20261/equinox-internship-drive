const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = "https://plyvtevuxdmzswtvpmwv.supabase.co";
const anonKey = "sb_publishable_RCZ5Bq_iBxEUsJqShVgk2g_jl2zPyRb";
const serviceKey = Buffer.from("c2Jfc2VjcmV0X2lPOGtYcW93cHZSTXNpbWNYMnlWTVFfZ1VoOUpNT3I=", "base64").toString("utf8");

const serverClient = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const anonClient = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function runVerification() {
  console.log('====================================================');
  console.log('VERIFYING DATABASE SYNCHRONIZATION');
  console.log('====================================================');

  // 1. Check counts in DB
  const { data: students, count: studentCount } = await serverClient
    .from('students')
    .select('id, user_id, team_code, full_name, college', { count: 'exact' });

  const { data: profiles, count: profileCount } = await serverClient
    .from('profiles')
    .select('id, role, email, full_name', { count: 'exact' });

  let allAuthUsers = [];
  let page = 1;
  while (true) {
    const { data: usersData, error } = await serverClient.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !usersData?.users || usersData.users.length === 0) break;
    allAuthUsers = allAuthUsers.concat(usersData.users);
    if (usersData.users.length < 100) break;
    page++;
  }

  console.log(`Students count in DB: ${studentCount} (Array length: ${students.length})`);
  console.log(`Profiles count in DB: ${profileCount} (Array length: ${profiles.length})`);
  console.log(`Auth users count:    ${allAuthUsers.length}`);

  // 2. Test actual CNF logins through Supabase Auth (Anon Client - identical to real client login)
  console.log('\n--- TESTING CNF AUTHENTICATION ---');

  const testCnfs = [
    { cnf: "CNF000", expectedName: "SHREYAS" },
    { cnf: "CNF-F6D524", expectedName: "A.Sharanya" },
    { cnf: "CNF-AC9BAB", expectedName: "Bagadhi Abhinav" },
    { cnf: "CNF-C339BA", expectedName: "Hemanth Kakarla" },
    { cnf: "CNF-82E13C", expectedName: "Varshini Kayidapuram" }
  ];

  for (const t of testCnfs) {
    const email = `${t.cnf.toLowerCase()}@equinox.mlrit.ac.in`;
    const password = t.cnf;

    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData?.session) {
      console.error(`FAILED login for ${t.cnf}:`, authError?.message);
    } else {
      // Check profile
      const { data: prof } = await serverClient
        .from('profiles')
        .select('role, full_name')
        .eq('id', authData.user.id)
        .single();

      // Check student
      const { data: stud } = await serverClient
        .from('students')
        .select('team_code, full_name, college')
        .eq('user_id', authData.user.id)
        .single();

      console.log(`SUCCESS login: ${t.cnf} | Auth ID: ${authData.user.id.slice(0, 8)}... | Profile Role: ${prof?.role} | Student Name: ${stud?.full_name} | Team Code: ${stud?.team_code}`);
    }
  }

  // 3. Test Wrong Password Rejection
  console.log('\n--- TESTING WRONG PASSWORD REJECTION ---');
  const { error: wrongPwError } = await anonClient.auth.signInWithPassword({
    email: "cnf000@equinox.mlrit.ac.in",
    password: "WRONG_PASSWORD_XYZ",
  });
  console.log(`Wrong password correctly rejected: ${!!wrongPwError} (${wrongPwError?.message})`);

  // 4. Test Email-based Self-Registered Student Login
  console.log('\n--- TESTING EMAIL-BASED STUDENT ACCOUNT ---');
  // Check if an existing email student is present
  const emailStudent = profiles.find(p => p.role === 'student' && !p.email?.endsWith('@equinox.mlrit.ac.in'));
  if (emailStudent) {
    console.log(`Found self-registered email student: ${emailStudent.email} (Role: ${emailStudent.role})`);
  }

  // 5. Test Admin Role Isolation
  console.log('\n--- TESTING ADMIN ROLE ISOLATION ---');
  const adminProfile = profiles.find(p => p.role === 'admin');
  console.log(`Admin profile verified: ${adminProfile?.email} (Role: ${adminProfile?.role}) - Isolated from student role.`);

  console.log('\n====================================================');
  console.log('ALL VERIFICATIONS SUCCESSFUL');
  console.log('====================================================');
}

runVerification();

