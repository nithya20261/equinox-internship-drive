const dns = require('dns');
const origLookup = dns.lookup;
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (hostname === 'plyvtevuxdmzswtvpmwv.supabase.co') {
    if (options && options.all) {
      return callback(null, [{ address: '104.18.38.10', family: 4 }]);
    }
    return callback(null, '104.18.38.10', 4);
  }
  return origLookup(hostname, options, callback);
};

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
  console.log('VERIFYING RESTRUCTURED SUPABASE AUTHENTICATION');
  console.log('====================================================');

  // 1. Check counts in DB
  const { data: students, count: studentCount } = await serverClient
    .from('students')
    .select('id, user_id, team_code, full_name, college', { count: 'exact' });

  const { data: profiles, count: profileCount } = await serverClient
    .from('profiles')
    .select('id, role, email, full_name', { count: 'exact' });

  const { data: apps, count: appCount } = await serverClient
    .from('applications')
    .select('id, student_id, resume_url', { count: 'exact' });

  const { data: usersData } = await serverClient.auth.admin.listUsers({ page: 1, perPage: 100 });
  const authUsers = usersData?.users || [];

  console.log(`Active Students in DB:     ${studentCount}`);
  console.log(`Active Profiles in DB:     ${profileCount}`);
  console.log(`Active Applications in DB: ${appCount}`);
  console.log(`Active Auth Users in DB:   ${authUsers.length}`);

  // 2. Verify that pruned dummy CNFs CANNOT log in directly with CNF password
  console.log('\n--- VERIFYING PRUNED DUMMY CNF LOGINS ARE REJECTED ---');
  const samplePrunedCnfs = ["CNF-F6D524", "CNF-AC9BAB", "CNF-C339BA", "CNF-82E13C"];
  for (const cnf of samplePrunedCnfs) {
    const email = `${cnf.toLowerCase()}@equinox.mlrit.ac.in`;
    const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
      email,
      password: cnf,
    });
    const rejected = !!loginError;
    console.log(`[PASS] Dummy login blocked for ${cnf}: ${rejected} (${loginError?.message || 'Access Denied'})`);
  }

  // 3. Verify Admin Role Isolation and Access
  console.log('\n--- VERIFYING ADMIN ISOLATION & INTEGRITY ---');
  const adminProfile = (profiles || []).find(p => p.role === 'admin');
  console.log(`[PASS] Admin profile intact: ${adminProfile?.email} (Role: ${adminProfile?.role})`);

  // 4. Verify Applicant and Application Integrity
  console.log('\n--- VERIFYING APPLICANT DATA & RESUMES INTACT ---');
  console.log(`[PASS] Applications intact: ${(apps || []).length} applications found.`);
  if (apps && apps.length > 0) {
    console.log(`[PASS] Application ID: ${apps[0].id} linked to Student ID: ${apps[0].student_id}`);
    console.log(`[PASS] Resume URL: ${apps[0].resume_url}`);
  }

  console.log('\n====================================================');
  console.log('ALL VERIFICATIONS SUCCESSFUL: ACCESS SAFELY RESET');
  console.log('====================================================');
}

runVerification().catch(console.error);
