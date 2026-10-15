import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in frontend environment variables."
    );
}

// Frontend uses the anon key — safe to expose to the browser.
// Row Level Security must be configured in the Supabase dashboard.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
