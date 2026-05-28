const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('bitacoras')
    .select(`
      bitacora_id, fecha, estado, plantilla_id, hora_entrada, hora_salida, caso_id,
      plantillas ( nombre ),
      casos!inner ( caso_id, alumno_id, usuario_id, creado_por ),
      bitacora_respuestas (
        valor,
        plantilla_campos ( campo_id, etiqueta, tipo )
      )
    `)
    .limit(2);
    
  console.log("Error:", error);
  console.log("Data length:", data?.length);
  if (data?.length > 0) console.log(JSON.stringify(data[0], null, 2));
}

run();
