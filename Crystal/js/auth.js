// ============================================
// AUTHENTICATION UTILITIES
// ============================================

/**
 * Check if user is logged in using Supabase session
 * @returns {Promise<Object|null>} User object if logged in, null otherwise
 */
async function checkAuthState() {
    if (!supabaseClient) {
        // Try to initialize if not already done
        const initialized = await waitForSupabase();
        if (!initialized) {
            return null;
        }
    }

    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) {
            console.error('Auth check error:', error);
            return null;
        }

        return session?.user || null;
    } catch (error) {
        console.error('Auth state check failed:', error);
        return null;
    }
}

/**
 * Get user profile data from database
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Profile data
 */
async function getUserProfile(userId) {
    if (!supabaseClient) initSupabase();

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Failed to fetch profile:', error);
        return null;
    }
}

/**
 * Get user activity statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Activity stats
 */
async function getUserStats(userId) {
    // Placeholder - implement based on your database schema
    // For now, return mock data
    return {
        resumes: 0,
        presentations: 0,
        writings: 0,
        challenges: 0,
        drafts: 0
    };
}

/**
 * Update navbar based on auth state
 * Shows Login button if logged out, Profile link if logged in
 */
async function updateNavbar() {
    const authItem = document.getElementById('auth-item');
    if (!authItem) return;

    const user = await checkAuthState();

    // Determine if we're in a subdirectory (modules folder)
    const isInSubdir = window.location.pathname.includes('/modules/');
    const pathPrefix = isInSubdir ? '../' : '';

    if (user) {
        // User is logged in - show Profile link
        authItem.innerHTML = `
            <a href="${pathPrefix}profile.html" class="btn btn-outline" style="padding: 8px 16px; font-size: 0.9rem;">
                <i class="fa-solid fa-user"></i> Profile
            </a>
        `;
    } else {
        // User is logged out - show Login button with referrer
        authItem.innerHTML = `
            <a href="#" onclick="storeLoginReferrer(); return false;" class="btn btn-outline" style="padding: 8px 16px; font-size: 0.9rem;">
                Login
            </a>
        `;
    }
}

/**
 * Logout user and redirect to home
 */
async function logout() {
    if (!supabaseClient) initSupabase();

    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;

        // Redirect to home page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout failed:', error);
        alert('Failed to logout. Please try again.');
    }
}

/**
 * Store the current page as login referrer
 */
function storeLoginReferrer() {
    const currentPage = window.location.href;
    sessionStorage.setItem('loginReferrer', currentPage);

    // Determine if we're in a subdirectory (modules folder)
    const isInSubdir = window.location.pathname.includes('/modules/');
    const loginPath = isInSubdir ? '../login.html' : 'login.html';

    window.location.href = loginPath;
}

/**
 * Get the URL to redirect to after login
 * @returns {string} URL to redirect to
 */
function getLoginRedirectUrl() {
    const referrer = sessionStorage.getItem('loginReferrer');
    sessionStorage.removeItem('loginReferrer'); // Clear after reading
    return referrer || 'profile.html';
}

/**
 * Protect page - redirect to login if not authenticated
 * Call this on pages that require authentication
 */
async function requireAuth() {
    const user = await checkAuthState();
    if (!user) {
        // Store current page before redirecting to login
        sessionStorage.setItem('loginReferrer', window.location.href);

        // Determine if we're in a subdirectory (modules folder)
        const isInSubdir = window.location.pathname.includes('/modules/');
        const loginPath = isInSubdir ? '../login.html' : 'login.html';

        window.location.href = loginPath;
    }
    return user;
}

// ============================================
// AUTO-INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase SDK to be available and initialize it
    const initialized = await waitForSupabase();

    if (!initialized) {
        console.error('Could not initialize Supabase. Auth features may not work.');
        return;
    }

    // Update navbar on every page load
    await updateNavbar();

    // Listen for auth state changes
    if (supabaseClient) {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            updateNavbar();
        });
    }
});
