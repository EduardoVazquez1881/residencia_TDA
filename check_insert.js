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
  const { data, error } = await supabase.from('notificaciones').insert({
    id: "e49053eb-69c6-43b2-9a00-ab35b43cdbd2",
    usuario_id: "00000000-0000-0000-0000-000000000000",
    titulo: "test",
    mensaje: "test",
    tipo: "test",
    leido: false
  });
  console.log("Insert result:", { data, error });
}
check();
