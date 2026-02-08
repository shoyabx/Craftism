// Resume Module Logic - Word-like Editor

// Formatting Function
function formatDoc(cmd, value = null) {
    if (value) {
        document.execCommand(cmd, false, value);
    } else {
        document.execCommand(cmd);
    }
}

// Apply Font Function
function applyFont(fontFamily) {
    const page = document.getElementById('resume-page');
    if (!page) return;

    // Save current selection
    const selection = window.getSelection();

    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        // Apply to selected text
        document.execCommand('fontName', false, fontFamily);
    } else {
        // Apply to entire document if no selection
        const confirmed = confirm(`No text selected. Apply ${fontFamily.replace(/'/g, '')} to the entire document?`);
        if (confirmed) {
            page.style.fontFamily = fontFamily;
            console.log(`Applied font ${fontFamily} to entire document`);
        }
    }

    // Refocus the editor
    page.focus();
}

// PDF Generation
function generatePDF() {
    const element = document.getElementById('resume-page');
    const opt = {
        margin: 0,
        filename: 'my-craftism-resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    alert("Generating PDF... This may take a moment.");
    html2pdf().set(opt).from(element).save();
}

// Multi-Draft Management System
const DRAFTS_KEY = 'craftism-resume-drafts';
const MAX_DRAFTS = 10;

// Get all drafts from localStorage
function getAllDrafts() {
    const draftsJson = localStorage.getItem(DRAFTS_KEY);
    return draftsJson ? JSON.parse(draftsJson) : [];
}

// Save all drafts to localStorage
function saveAllDrafts(drafts) {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

// Save Draft with prompt for name
function saveDraft() {
    const page = document.getElementById('resume-page');
    if (!page) return;

    const content = page.innerHTML;
    if (content.trim() === '<p><br></p>' || content.trim() === '') {
        alert('Cannot save empty document.');
        return;
    }

    // Prompt user for draft name
    const draftName = prompt('Enter a name for this draft:', `Resume Draft ${new Date().toLocaleDateString()}`);
    if (!draftName) return; // User cancelled

    const drafts = getAllDrafts();

    // Create new draft object
    const newDraft = {
        id: Date.now(),
        name: draftName,
        content: content,
        timestamp: new Date().toISOString(),
        lastModified: new Date().toLocaleString()
    };

    // Add to beginning of array
    drafts.unshift(newDraft);

    // Keep only MAX_DRAFTS
    if (drafts.length > MAX_DRAFTS) {
        drafts.splice(MAX_DRAFTS);
    }

    saveAllDrafts(drafts);

    // Visual feedback
    const saveBtn = document.getElementById('btn-save-draft');
    if (saveBtn) {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved ✓';
        setTimeout(() => {
            saveBtn.textContent = originalText;
        }, 2000);
    }

    console.log('Draft saved:', draftName);
}

// Auto-save (saves to a special auto-save slot)
function autoSaveDraft() {
    const page = document.getElementById('resume-page');
    if (!page) return;

    const content = page.innerHTML;
    if (content.trim() === '<p><br></p>' || content.trim() === '') {
        return; // Don't auto-save empty content
    }

    const drafts = getAllDrafts();

    // Check if there's already an auto-save draft
    const autoSaveIndex = drafts.findIndex(d => d.name === '[Auto-Save]');

    const autoSaveDraft = {
        id: autoSaveIndex >= 0 ? drafts[autoSaveIndex].id : Date.now(),
        name: '[Auto-Save]',
        content: content,
        timestamp: new Date().toISOString(),
        lastModified: new Date().toLocaleString()
    };

    if (autoSaveIndex >= 0) {
        // Update existing auto-save
        drafts[autoSaveIndex] = autoSaveDraft;
    } else {
        // Add new auto-save at the beginning
        drafts.unshift(autoSaveDraft);
        // Keep only MAX_DRAFTS
        if (drafts.length > MAX_DRAFTS) {
            drafts.splice(MAX_DRAFTS);
        }
    }

    saveAllDrafts(drafts);
    console.log('Auto-saved at', new Date().toLocaleTimeString());
}

// Show Draft Selection Dialog
function showDraftDialog() {
    const drafts = getAllDrafts();

    if (drafts.length === 0) {
        alert('No saved drafts found.');
        return;
    }

    // Create modal dialog
    const modal = document.createElement('div');
    modal.id = 'draft-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    const dialogBox = document.createElement('div');
    dialogBox.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    const title = document.createElement('h2');
    title.textContent = 'Select a Draft to Load';
    title.style.cssText = `
        margin: 0 0 1.5rem 0;
        color: #112B3C;
        font-family: Impact, sans-serif;
        font-size: 1.8rem;
    `;

    const draftList = document.createElement('div');
    draftList.style.cssText = 'display: flex; flex-direction: column; gap: 0.75rem;';

    drafts.forEach((draft, index) => {
        const draftItem = document.createElement('div');
        draftItem.style.cssText = `
            padding: 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            background: ${draft.name === '[Auto-Save]' ? '#fef3c7' : 'white'};
        `;

        draftItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <strong style="color: #112B3C; font-size: 1.1rem;">${draft.name}</strong>
                <button class="delete-draft-btn" data-index="${index}" style="
                    background: #fee2e2;
                    color: #991b1b;
                    border: none;
                    padding: 4px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: bold;
                ">Delete</button>
            </div>
            <div style="color: #6B7280; font-size: 0.9rem;">
                Last modified: ${draft.lastModified}
            </div>
        `;

        draftItem.addEventListener('mouseenter', () => {
            draftItem.style.borderColor = '#F66B0E';
            draftItem.style.transform = 'translateY(-2px)';
            draftItem.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        });

        draftItem.addEventListener('mouseleave', () => {
            draftItem.style.borderColor = '#e5e7eb';
            draftItem.style.transform = 'translateY(0)';
            draftItem.style.boxShadow = 'none';
        });

        draftItem.addEventListener('click', (e) => {
            // Don't load if clicking delete button
            if (e.target.classList.contains('delete-draft-btn')) return;

            loadDraft(draft);
            document.body.removeChild(modal);
        });

        draftList.appendChild(draftItem);
    });

    // Add event listeners for delete buttons
    draftList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-draft-btn')) {
            e.stopPropagation();
            const index = parseInt(e.target.getAttribute('data-index'));
            deleteDraft(index);
            document.body.removeChild(modal);
            // Reopen dialog to show updated list
            setTimeout(() => showDraftDialog(), 100);
        }
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cancel';
    closeBtn.style.cssText = `
        margin-top: 1.5rem;
        padding: 10px 24px;
        background: #e5e7eb;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        width: 100%;
        font-size: 1rem;
    `;
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    dialogBox.appendChild(title);
    dialogBox.appendChild(draftList);
    dialogBox.appendChild(closeBtn);
    modal.appendChild(dialogBox);
    document.body.appendChild(modal);

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Load a specific draft
function loadDraft(draft) {
    const page = document.getElementById('resume-page');
    if (page) {
        page.innerHTML = draft.content;
        console.log('Loaded draft:', draft.name);
    }
}

// Delete a draft
function deleteDraft(index) {
    const drafts = getAllDrafts();
    const draftName = drafts[index].name;

    if (confirm(`Delete draft "${draftName}"?`)) {
        drafts.splice(index, 1);
        saveAllDrafts(drafts);
        console.log('Deleted draft:', draftName);
    }
}

// Auto-save functionality (every 30 seconds)
let autoSaveInterval;
function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        autoSaveDraft();
    }, 30000); // 30 seconds
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const page = document.getElementById('resume-page');
    // Ensure page has focusability
    if (page) {
        page.focus();
    }

    // Check if we need to load a specific draft from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const draftId = urlParams.get('draftId');
    const isUpload = urlParams.get('upload');

    if (draftId) {
        // Load the specific draft
        const drafts = getAllDrafts();
        const draft = drafts.find(d => d.id == draftId);
        if (draft) {
            loadDraft(draft);
            // Remove the parameter from URL without reloading
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } else if (isUpload === 'true') {
        // Check for uploaded content
        console.log('Upload flag detected, checking localStorage...');
        const uploadedContent = localStorage.getItem('craftism-uploaded-content');
        console.log('Uploaded content from storage:', uploadedContent);

        if (uploadedContent && page) {
            console.log('Loading uploaded content into editor');
            page.innerHTML = uploadedContent;
            localStorage.removeItem('craftism-uploaded-content');
            // Remove the parameter from URL without reloading
            window.history.replaceState({}, document.title, window.location.pathname);
            console.log('Upload content loaded successfully');
        } else {
            console.log('No uploaded content found or page not ready');
        }
    }

    // Hook up Toolbar Buttons
    const buttons = document.querySelectorAll('.tool-btn');
    buttons.forEach(btn => {
        // execute command on mousedown to be 100% sure we don't lose selection
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Stop focus loss

            const button = e.target.closest('.tool-btn');
            const cmd = button.getAttribute('data-command');

            if (cmd) {
                formatDoc(cmd);
            }
        });

        // Disable click to avoid double-firing if we moved logic to mousedown
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    // Handle PDF Download
    const downloadBtn = document.getElementById('btn-download-pdf');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            generatePDF();
        });
    }

    // Handle Save Draft
    const saveDraftBtn = document.getElementById('btn-save-draft');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveDraft();
        });
    }

    // Handle Retrieve Draft (show dialog)
    const retrieveDraftBtn = document.getElementById('btn-retrieve-draft');
    if (retrieveDraftBtn) {
        retrieveDraftBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showDraftDialog();
        });
    }

    // Handle Font Selector
    const fontSelector = document.getElementById('font-selector');
    if (fontSelector) {
        fontSelector.addEventListener('change', (e) => {
            const fontFamily = e.target.value;
            if (fontFamily) {
                // Apply font to selected text or entire document
                applyFont(fontFamily);
                // Reset selector to default
                e.target.value = '';
            }
        });
    }

    // Start auto-save
    startAutoSave();

    // Save before page unload
    window.addEventListener('beforeunload', () => {
        if (page && page.innerHTML.trim() !== '<p><br></p>') {
            autoSaveDraft();
        }
    });
});
