// ══════════════════════════════════════════════════════
// UPLOAD HANDLER — PDF/DOCX/TXT → localStorage → redirect
// ══════════════════════════════════════════════════════

var UPLOAD_CONTENT_KEY = 'craftism-uploaded-content';
var UPLOAD_FORMAT_KEY  = 'craftism-uploaded-format';

async function handleFileUpload(file) {
    if (!file) { alert('Please select a file.'); return; }
    var fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx') && !fileName.endsWith('.doc') && !fileName.endsWith('.txt')) {
        alert('Please upload a PDF, DOCX, or TXT file.'); return;
    }

    try {
        var content = '';
        var format = 'text';

        if (fileName.endsWith('.txt')) {
            content = await readTextFile(file);
            format = 'text';

        } else if (fileName.endsWith('.pdf')) {
            content = await extractPDFText(file);
            format = 'text';

        } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            if (typeof mammoth === 'undefined') { alert('DOCX library not loaded.'); return; }
            var buf = await readFileAsArrayBuffer(file);
            var result = await mammoth.convertToHtml({
                arrayBuffer: buf,
                styleMap: [
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Heading 3'] => h3:fresh",
                    "p[style-name='Title'] => h1.title:fresh",
                    "p[style-name='Normal'] => p:fresh"
                ],
                includeDefaultStyleMap: true,
            });
            content = result.value;
            format = 'html';
        }

        if (content && content.trim()) {
            localStorage.setItem(UPLOAD_CONTENT_KEY, content);
            localStorage.setItem(UPLOAD_FORMAT_KEY, format);
            setTimeout(function() { window.location.href = 'templates.html?upload=true'; }, 100);
        } else {
            alert('No content found in the file.');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to process file: ' + error.message);
    }
}

// ── PDF Text Extraction via pdf.js ──────────────────
async function extractPDFText(file) {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error('PDF.js library not loaded. Please refresh and try again.');
    }
    var arrayBuffer = await readFileAsArrayBuffer(file);
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var allText = '';

    for (var i = 1; i <= pdf.numPages; i++) {
        var page = await pdf.getPage(i);
        var textContent = await page.getTextContent();
        var lastY = null;
        var pageText = '';

        // Preserve line breaks by detecting Y-position changes
        textContent.items.forEach(function(item) {
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 2) {
                pageText += '\n';
            }
            pageText += item.str;
            lastY = item.transform[5];
        });

        allText += pageText + '\n\n';
    }
    return allText;
}

// ── File readers ────────────────────────────────────
function readFileAsArrayBuffer(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) { resolve(e.target.result); };
        reader.onerror = function(e) { reject(e); };
        reader.readAsArrayBuffer(file);
    });
}

function readTextFile(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) { resolve(e.target.result); };
        reader.onerror = function(e) { reject(e); };
        reader.readAsText(file);
    });
}

// ── Retrieve stored upload (called by templates.js) ─
function getUploadedContent() {
    var content = localStorage.getItem(UPLOAD_CONTENT_KEY);
    var format = localStorage.getItem(UPLOAD_FORMAT_KEY) || 'text';
    if (content) {
        localStorage.removeItem(UPLOAD_CONTENT_KEY);
        localStorage.removeItem(UPLOAD_FORMAT_KEY);
        return { content: content, format: format };
    }
    return null;
}
