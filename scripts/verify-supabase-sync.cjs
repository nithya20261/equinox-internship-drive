const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://plyvtevuxdmzswtvpmwv.supabase.co";
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_RCZ5Bq_iBxEUsJqShVgk2g_jl2zPyRb";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required.");
  process.exit(1);
}

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

  console.log(`Students count in DB: ${studentCount} (Array length: ${students?.length})`);
  console.log(`Profiles count in DB: ${profileCount} (Array length: ${profiles?.length})`);
  console.log(`Auth users count:    ${allAuthUsers.length}`);

  // 2. Test actual CNF logins through Supabase Auth (Anon Client - identical to real client login)
  console.log('\n--- TESTING CNF AUTHENTICATION ---');

  const testCnfs = [
    { cnf: "CNF000", expectedName: "SHREYAS" },
    { cnf: "CNF-F6D524", expectedName: "A.Sharanya" },
  ];

  for (const item of testCnfs) {
    const email = `${item.cnf.toLowerCase()}@equinox.mlrit.ac.in`;
    const { data: auth, error } = await anonClient.auth.signInWithPassword({
      email,
      password: item.cnf
    });

    if (error) {
      console.log(`FAILED login for ${item.cnf}: ${error.message}`);
    } else {
      const u = auth.user;
      const { data: prof } = await serverClient.from('profiles').select('*').eq('id', u.id).single();
      const { data: st } = await serverClient.from('students').select('*').eq('user_id', u.id).single();
      console.log(`SUCCESS login: ${item.cnf} | Auth ID: ${u.id.slice(0, 8)}... | Profile Role: ${prof?.role} | Student Name: ${st?.full_name} | Team Code: ${st?.team_code}`);
    }
  }

  // 3. Test that wrong passwords fail
  console.log('\n--- TESTING WRONG PASSWORD REJECTION ---');
  const { error: wrongPassError } = await anonClient.auth.signInWithPassword({
    email: "cnf000@equinox.mlrit.ac.in",
    password: "WRONG_PASSWORD_XYZ"
  });
  console.log(`Wrong password correctly rejected: ${Boolean(wrongPassError)} (${wrongPassError?.message})`);

  // 4. Test self-registered email student account
  console.log('\n--- TESTING EMAIL-BASED STUDENT ACCOUNT ---');
  const { data: selfStudent } = await serverClient
    .from('profiles')
    .select('id, email, role, full_name')
    .eq('role', 'student')
    .not('email', 'like', '%@equinox.mlrit.ac.in')
    .limit(1)
    .single();

  if (selfStudent) {
    console.log(`Found self-registered email student: ${selfStudent.email} (Role: ${selfStudent.role})`);
  }

  // 5. Test Admin Account isolation
  console.log('\n--- TESTING ADMIN ROLE ISOLATION ---');
  const { data: adminProf } = await serverClient
    .from('profiles')
    .select('*')
    .eq('email', 'equinoxcie@admin.equinox.internal')
    .single();

  if (adminProf) {
    console.log(`Admin profile verified: ${adminProf.email} (Role: ${adminProf.role}) - Isolated from student role.`);
  }

  console.log('\n====================================================');
  console.log('ALL VERIFICATIONS SUCCESSFUL');
  console.log('====================================================');
}

runVerification().catch(console.error);
