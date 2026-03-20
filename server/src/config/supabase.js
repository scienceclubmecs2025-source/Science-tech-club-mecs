const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔑 Supabase URL:', supabaseUrl ? '✓ Set' : '✗ MISSING');
console.log('🔑 Service Role Key:', supabaseKey ? `✓ Set (starts with: ${supabaseKey?.substring(0, 20)}...)` : '✗ MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials — server will not work correctly');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
