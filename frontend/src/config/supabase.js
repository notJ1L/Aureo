import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// The client is created lazily so the app can still boot (and the Google
// sign-in path can still work) when the Supabase keys are not configured.
let client = null;

const getSupabase = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env"
        );
    }

    if (!client) {
        client = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
    }

    return client;
};

export const isSupabaseConfigured = () =>
    Boolean(supabaseUrl && supabaseAnonKey);

export default getSupabase;
