const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local file not found in current directory!');
    process.exit(1);
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] ? match[2].trim() : '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value;
    }
  });
  return env;
}

async function runCheck() {
  const env = loadEnv();
  
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const isMock = env.NEXT_PUBLIC_MOCK_SUPABASE === 'true';

  console.log('=== Supabase Configuration Check ===');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', url);
  console.log('NEXT_PUBLIC_MOCK_SUPABASE:', isMock);
  console.log('Anon Key Present:', !!anonKey, anonKey ? `(starts with ${anonKey.slice(0, 10)}...)` : '');
  console.log('Service Role Key Present:', !!serviceKey, serviceKey ? `(starts with ${serviceKey.slice(0, 10)}...)` : '');
  
  if (url.includes('127.0.0.1') || url.includes('localhost')) {
    console.log('\n⚠️ WARNING: Your URL points to localhost.');
  }

  if (isMock) {
    console.log('\nMock Mode is active. Script will test mock database files.');
    // Try to read the mock db file
    const mockDbPath = path.join(process.cwd(), 'lib', 'supabase', 'mock_db.json');
    if (fs.existsSync(mockDbPath)) {
      console.log('Mock DB file found successfully.');
      try {
        const data = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
        console.log(`Mock DB contains ${data.users?.length ?? 0} users and ${data.menu_items?.length ?? 0} menu items.`);
      } catch (err) {
        console.error('Error parsing mock DB JSON:', err.message);
      }
    } else {
      console.error('Mock DB file not found at:', mockDbPath);
    }
    return;
  }

  console.log('\n=== Connecting to Live Supabase ===');
  
  // 1. Test Anon client
  console.log('Initializing Anon Client...');
  const anonClient = createClient(url, anonKey);
  
  try {
    const { data: menuData, error: menuError } = await anonClient
      .from('menu_items')
      .select('id, name')
      .limit(2);
      
    if (menuError) {
      console.error('❌ Anon client fetch menu_items failed:', menuError.message);
    } else {
      console.log('✅ Anon client fetch menu_items succeeded. Found:', menuData.map(m => m.name).join(', '));
    }
  } catch (err) {
    console.error('❌ Anon client crashed:', err.message);
  }

  // 2. Test Admin Service Role client
  console.log('\nInitializing Service Role Client...');
  const adminClient = createClient(url, serviceKey);
  
  try {
    const { data: usersData, error: usersError } = await adminClient
      .from('users')
      .select('id, email, role')
      .limit(3);
      
    if (usersError) {
      console.error('❌ Service role client fetch users failed:', usersError.message);
    } else {
      console.log('✅ Service role client fetch users succeeded. Found users:', usersData.map(u => u.email).join(', '));
    }
  } catch (err) {
    console.error('❌ Service role client crashed:', err.message);
  }
}

runCheck().catch(err => {
  console.error('Check failed with error:', err);
});
