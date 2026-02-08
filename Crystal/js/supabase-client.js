// Supabase Client Initialization
// Using CDN import via HTML script tag

const SUPABASE_URL = 'https://bvioymmybgkmqzjxnltz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vkSIeR911XGcxt98oaTo9A_wg8SyrO-';

// Check if supabase global exists (it will be loaded in HTML via CDN)
let supabaseClient = null;

function initSupabase() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase initialized');
        return true;
    } else {
        console.warn('Supabase SDK not loaded yet.');
        return false;
    }
}

/**
 * Wait for Supabase SDK to be available and initialize it
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<boolean>} - True if initialized successfully
 */
async function waitForSupabase(maxRetries = 10, delay = 100) {
    for (let i = 0; i < maxRetries; i++) {
        if (initSupabase()) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    console.error('Failed to initialize Supabase after', maxRetries, 'attempts');
    return false;
}
