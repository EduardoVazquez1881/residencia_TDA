const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value) acc[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .order('creado_en', { ascending: false })
    .limit(5);

  console.log("Recent notifications:", JSON.stringify({ data, error }, null, 2));
}
check();
