const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://jkhyzfjwofgdhsrogwqe.supabase.co";
const supabasePublishableKey = "sb_publishable_pmRt-xUlGMkRXErNgiuFcA_UJdYqGAh";

const supabase = createClient(supabaseUrl, supabasePublishableKey);

async function main() {
  console.log("=== LATEST BITACORAS ===");
  const { data: bitacoras, error: bitError } = await supabase
    .from("bitacoras")
    .select("bitacora_id, estado")
    .limit(10);

  if (bitError) {
    console.error("Error fetching bitacoras:", bitError);
  } else {
    console.log(JSON.stringify(bitacoras, null, 2));
  }
}

main().catch(console.error);

