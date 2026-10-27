import { createClient } from "@supabase/supabase-js";

let rawUrl = (import.meta.env["VITE_SUPABASE_URL"] as string) || "https://plyvtevuxdmzswtvpmwv.supabase.co";
if (rawUrl.includes("supabase.com/dashboard/project/")) {
  const ref = rawUrl.split("dashboard/project/")[1]?.replace(/[\/\?].*$/, "");
  if (ref) rawUrl = `https://${ref}.supabase.co`;
}

const supabaseKey =
  (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string) ||
  "sb_publishable_RCZ5Bq_iBxEUsJqShVgk2g_jl2zPyRb";

export const supabase = createClient(rawUrl, supabaseKey);
