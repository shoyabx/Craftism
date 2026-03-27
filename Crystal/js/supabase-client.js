// Supabase Client Initialization

const SUPABASE_URL = 'https://oesyuyxahvudrdjkeyyh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_UGAMF3ae5nGhhme_gq85pw_b27qgacp';

let supabaseClient = null;

/**
 * Initialize the Supabase client.
 * Safe to call multiple times — will not re-create if already initialized.
 */
function initSupabase() {
    if (supabaseClient) return true; // already initialized
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,       // save session to localStorage
                autoRefreshToken: true,     // refresh token automatically
                detectSessionInUrl: true    // handle OAuth redirects
            }
        });
        console.log('[Supabase] Client initialized');
        return true;
    }
    console.warn('[Supabase] SDK not loaded yet');
    return false;
}

/**
 * Wait up to 1s for the Supabase SDK CDN script to load, then initialize.
 */
async function waitForSupabase(maxRetries = 20, delay = 50) {
    for (let i = 0; i < maxRetries; i++) {
        if (initSupabase()) return true;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    console.error('[Supabase] SDK failed to load after retries');
    return false;
}

// ─── AUTO-INITIALIZE immediately when this script runs ───────────────────────
// The Supabase CDN <script> is in <head> (blocking), so `supabase` global
// should already exist by the time this file runs at the bottom of <body>.
initSupabase();
