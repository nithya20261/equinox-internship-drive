const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://plyvtevuxdmzswtvpmwv.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function checkSync() {
  console.log('Checking database state...');
  const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
  const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  console.log(`Current DB records: ${studentCount} students, ${profileCount} profiles.`);
}

checkSync().catch(console.error);
