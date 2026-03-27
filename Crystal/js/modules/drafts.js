// ══════════════════════════════════════════════════════
// DRAFTS ENGINE — Auth-aware CRUD + Auto-save
// Works with Supabase (logged in) or sessionStorage (guest)
// ══════════════════════════════════════════════════════

var DRAFTS_SESSION_KEY = 'craftism-guest-drafts';

// ── UUID generator ──────────────────────────────────
function generateDraftId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// ══════════════════════════════════════════════════════
// 1. GUEST STORAGE (sessionStorage — cleared on close)
// ══════════════════════════════════════════════════════
function getGuestDrafts() {
    try {
        var raw = sessionStorage.getItem(DRAFTS_SESSION_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
}

function setGuestDrafts(drafts) {
    sessionStorage.setItem(DRAFTS_SESSION_KEY, JSON.stringify(drafts));
}

function guestCreateDraft(draft) {
    var drafts = getGuestDrafts();
    drafts.unshift(draft);
    setGuestDrafts(drafts);
    return draft;
}

function guestUpdateDraft(id, updates) {
    var drafts = getGuestDrafts();
    for (var i = 0; i < drafts.length; i++) {
        if (drafts[i].id === id) {
            Object.assign(drafts[i], updates, { updated_at: new Date().toISOString() });
            setGuestDrafts(drafts);
            return drafts[i];
        }
    }
    return null;
}

function guestDeleteDraft(id) {
    var drafts = getGuestDrafts().filter(function(d) { return d.id !== id; });
    setGuestDrafts(drafts);
}

function guestGetDraft(id) {
    return getGuestDrafts().find(function(d) { return d.id === id; }) || null;
}

// ══════════════════════════════════════════════════════
// 2. SUPABASE STORAGE (logged in — persistent)
// ══════════════════════════════════════════════════════
async function cloudCreateDraft(userId, draft) {
    var row = {
        user_id: userId,
        title: draft.title || 'Untitled Resume',
        content: {
            resume: draft.resume,
            settings: draft.settings,
            sections: draft.sections,
            source_type: draft.source_type || 'created',
            ats_score: draft.ats_score || null,
            original_format_config: draft.original_format_config || null,
        }
    };
    var res = await supabaseClient.from('resumes').insert(row).select().single();
    if (res.error) throw res.error;
    return res.data;
}

async function cloudUpdateDraft(id, draft) {
    var row = {
        title: draft.title || 'Untitled Resume',
        content: {
            resume: draft.resume,
            settings: draft.settings,
            sections: draft.sections,
            source_type: draft.source_type || 'created',
            ats_score: draft.ats_score || null,
            original_format_config: draft.original_format_config || null,
        },
        updated_at: new Date().toISOString()
    };
    var res = await supabaseClient.from('resumes').update(row).eq('id', id);
    if (res.error) throw res.error;
    return true;
}

async function cloudFetchDrafts(userId) {
    var res = await supabaseClient
        .from('resumes')
        .select('id, title, content, updated_at, created_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(20);
    if (res.error) throw res.error;
    return res.data || [];
}

async function cloudGetDraft(id) {
    var res = await supabaseClient.from('resumes').select('*').eq('id', id).single();
    if (res.error) throw res.error;
    return res.data;
}

async function cloudDeleteDraft(id) {
    var res = await supabaseClient.from('resumes').delete().eq('id', id);
    if (res.error) throw res.error;
    return true;
}

async function cloudRenameDraft(id, newTitle) {
    var res = await supabaseClient.from('resumes').update({ title: newTitle, updated_at: new Date().toISOString() }).eq('id', id);
    if (res.error) throw res.error;
    return true;
}

// ══════════════════════════════════════════════════════
// 3. UNIFIED API — routes to guest or cloud
// ══════════════════════════════════════════════════════
async function draftsCreate(stateObj, sourceType, atsScore) {
    var draft = {
        id: generateDraftId(),
        title: (stateObj.resume.header.name || 'Untitled') + "'s Resume",
        resume: stateObj.resume,
        settings: stateObj.settings,
        sections: stateObj.sections,
        source_type: sourceType || 'created',
        ats_score: atsScore || null,
        original_format_config: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    var user = null;
    if (typeof checkAuthState === 'function') {
        user = await checkAuthState();
    }

    if (user && typeof supabaseClient !== 'undefined' && supabaseClient) {
        var row = await cloudCreateDraft(user.id, draft);
        return row.id; // return Supabase UUID
    } else {
        guestCreateDraft(draft);
        return draft.id;
    }
}

async function draftsUpdate(id, stateObj, atsScore) {
    var draft = {
        title: (stateObj.resume.header.name || 'Untitled') + "'s Resume",
        resume: stateObj.resume,
        settings: stateObj.settings,
        sections: stateObj.sections,
        ats_score: atsScore || null,
    };

    var user = null;
    if (typeof checkAuthState === 'function') {
        user = await checkAuthState();
    }

    if (user && typeof supabaseClient !== 'undefined' && supabaseClient) {
        await cloudUpdateDraft(id, draft);
    } else {
        guestUpdateDraft(id, draft);
    }
}

async function draftsFetchAll() {
    var user = null;
    if (typeof checkAuthState === 'function') {
        user = await checkAuthState();
    }

    if (user && typeof supabaseClient !== 'undefined' && supabaseClient) {
        var rows = await cloudFetchDrafts(user.id);
        // Normalize shape
        return rows.map(function(r) {
            var c = r.content || {};
            return {
                id: r.id,
                title: r.title || 'Untitled',
                source_type: c.source_type || 'created',
                ats_score: c.ats_score || null,
                template: (c.settings && c.settings.template) || 'classic',
                updated_at: r.updated_at,
                created_at: r.created_at,
            };
        });
    } else {
        return getGuestDrafts().map(function(d) {
            return {
                id: d.id,
                title: d.title || 'Untitled',
                source_type: d.source_type || 'created',
                ats_score: d.ats_score || null,
                template: (d.settings && d.settings.template) || 'classic',
                updated_at: d.updated_at,
                created_at: d.created_at,
            };
        });
    }
}

async function draftsGet(id) {
    var user = null;
    if (typeof checkAuthState === 'function') {
        user = await checkAuthState();
    }

    if (user && typeof supabaseClient !== 'undefined' && supabaseClient) {
        var row = await cloudGetDraft(id);
        var c = row.content || {};
        return {
            id: row.id,
            title: row.title,
            resume: c.resume,
            settings: c.settings,
            sections: c.sections,
            source_type: c.source_type || 'created',
            ats_score: c.ats_score || null,
        };
    } else {
        var d = guestGetDraft(id);
        return d;
    }
}

async function draftsDelete(id) {
    var user = null;
    if (typeof checkAuthState === 'function') {
        user = await checkAuthState();
    }

    if (user && typeof supabaseClient !== 'undefined' && supabaseClient) {
        await cloudDeleteDraft(id);
    } else {
        guestDeleteDraft(id);
    }
}

async function draftsRename(id, newTitle) {
    var user = null;
    if (typeof checkAuthState === 'function') {
        user = await checkAuthState();
    }

    if (user && typeof supabaseClient !== 'undefined' && supabaseClient) {
        await cloudRenameDraft(id, newTitle);
    } else {
        guestUpdateDraft(id, { title: newTitle });
    }
}

// ══════════════════════════════════════════════════════
// 4. AUTO-SAVE ENGINE (debounce-based)
// ══════════════════════════════════════════════════════
var _autoSaveTimer = null;
var _autoSaveDraftId = null;
var _lastSaveHash = '';
var _autoSaveSourceType = 'created';
var _isSaving = false;

function computeStateHash(stateObj) {
    return JSON.stringify({ r: stateObj.resume, s: stateObj.settings, sc: stateObj.sections });
}

function initAutoSave(draftId, sourceType) {
    _autoSaveDraftId = draftId;
    _autoSaveSourceType = sourceType || 'created';
    _lastSaveHash = computeStateHash(state);
}

function triggerAutoSave(stateObj, atsScore) {
    if (_isSaving) return;
    clearTimeout(_autoSaveTimer);
    _autoSaveTimer = setTimeout(function() {
        performAutoSave(stateObj, atsScore);
    }, 3000); // 3 second debounce
}

async function performAutoSave(stateObj, atsScore) {
    var currentHash = computeStateHash(stateObj);
    if (currentHash === _lastSaveHash) return; // no changes

    _isSaving = true;
    showAutoSaveStatus('saving');

    try {
        if (!_autoSaveDraftId) {
            // First save — create draft
            _autoSaveDraftId = await draftsCreate(stateObj, _autoSaveSourceType, atsScore);
        } else {
            // Subsequent saves — update
            await draftsUpdate(_autoSaveDraftId, stateObj, atsScore);
        }
        _lastSaveHash = currentHash;
        showAutoSaveStatus('saved');
    } catch(e) {
        console.error('[AutoSave] Failed:', e);
        showAutoSaveStatus('error');
        // Retry once after 5s
        setTimeout(function() {
            _isSaving = false;
            triggerAutoSave(stateObj, atsScore);
        }, 5000);
    }
    _isSaving = false;
}

function showAutoSaveStatus(status) {
    var el = document.getElementById('autosave-status');
    if (!el) return;
    if (status === 'saving') {
        el.textContent = 'Saving…';
        el.style.color = '#94a3b8';
    } else if (status === 'saved') {
        el.textContent = 'Saved';
        el.style.color = '#16a34a';
        setTimeout(function() { if (el.textContent === 'Saved') el.textContent = ''; }, 3000);
    } else if (status === 'error') {
        el.textContent = 'Save failed';
        el.style.color = '#dc2626';
    }
}
