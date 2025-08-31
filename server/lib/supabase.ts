import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nxipkmxbvdrwdtujjlyr.supabase.co";
// Using correct service role key for server-side operations
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aXBrbXhidmRyd2R0dWpqbHlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMyOTgwNSwiZXhwIjoyMDcwOTA1ODA1fQ._ZrEyy4Lx11MkCljLQVnWHj1cXM6xcRSCuP6e-r3tO4";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
