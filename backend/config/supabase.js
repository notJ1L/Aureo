const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// The clients are created lazily so the module can always be required, even in
// environments (like automated tests) that do not provide Supabase keys.
// `getSupabaseAdmin()` and `getSupabaseAnon()` throw a readable error when the
// provider is genuinely needed but not configured.
const createSupabaseClient = (key, options) => {
    if (!supabaseUrl || !key) {
        return null;
    }

    return createClient(supabaseUrl, key, options);
};

const adminClient = createSupabaseClient(supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const anonClient = createSupabaseClient(supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const requireClient = (client, label) => {
    if (!client) {
        throw new Error(
            `${label} is not configured. Set SUPABASE_URL and the matching Supabase key in backend/config/.env`
        );
    }

    return client;
};

const getSupabaseAdmin = () => requireClient(adminClient, "Supabase admin client");
const getSupabaseAnon = () => requireClient(anonClient, "Supabase anonymous client");

const isSupabaseConfigured = () => Boolean(supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey));

module.exports = {
    supabaseAdmin: adminClient,
    supabaseAnon: anonClient,
    getSupabaseAdmin,
    getSupabaseAnon,
    isSupabaseConfigured
};
