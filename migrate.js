const { createClient } = require('@supabase/supabase-js');

const OLD_URL = 'https://xhggbtszrbngxdowfpum.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZ2didHN6cmJuZ3hkb3dmcHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjg1OTIsImV4cCI6MjA5MDgwNDU5Mn0.WVR8dtu7vyZ9xzI1iKyBVoKKGK7oYQqd7sr0ilS-gYo';   // hoặc service_role key

const NEW_URL = 'https://tmxrgixbqrqqrbganpfr.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteHJnaXhicXJxcXJiZ2FucGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTIzNDMsImV4cCI6MjA5MTI4ODM0M30.oJUrK45KCG-Lnj4MHKwUcfTjkxbdIGoJFnEzxiRE_BE';

const oldSupabase = createClient(OLD_URL, OLD_KEY);
const newSupabase = createClient(NEW_URL, NEW_KEY);

async function migrateTable(tableName) {
  console.log(`Đang copy bảng: ${tableName}...`);
  const { data, error } = await oldSupabase.from(tableName).select('*');
  if (error) {
    console.error(`Lỗi copy ${tableName}:`, error);
    return;
  }
  if (data && data.length > 0) {
    const { error: insertError } = await newSupabase.from(tableName).insert(data);
    if (insertError) console.error(`Lỗi insert ${tableName}:`, insertError);
    else console.log(`✓ Copy ${tableName} thành công (${data.length} rows)`);
  } else {
    console.log(`✓ Bảng ${tableName} rỗng`);
  }
}

async function start() {
  const tables = ['profiles', 'vehicles', 'payment_logs', 'runs', 'user_subscriptions', 'packages', 'racer_snapshots'];
  for (const table of tables) {
    await migrateTable(table);
  }
  console.log('HOÀN TẤT!');
}

start();