// ══════════════════════════════════════════════════════
// UPLOAD HANDLER — File intake for PDF/DOCX/TXT
// Redirects parsed content to templates.html
// ══════════════════════════════════════════════════════

var UPLOAD_CONTENT_KEY = 'craftism-uploaded-content';
var UPLOAD_FORMAT_KEY  = 'craftism-uploaded-format';

/**
 * Handle file upload — extract content, store, redirect
 */
async function handleFileUpload(file) {
    if (!file) { alert('Please select a file.'); return; }

    var fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx') && !fileName.endsWith('.doc') && !fileName.endsWith('.txt')) {
        alert('Please upload a PDF, DOCX, or TXT file.');
        return;
    }

    try {
        var content = '';
        var format = 'text';

        if (fileName.endsWith('.txt')) {
            content = await readTextFile(file);
            format = 'text';
        } else if (fileName.endsWith('.pdf')) {
            // Use pdf.js if loaded
            if (typeof pdfjsLib !== 'undefined') {
                content = await extractPDFText(file);
                format = 'text';
            } else {
                alert('PDF parsing requires pdf.js library. Please use DOCX or TXT for now.');
                return;
            }
        } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            if (typeof mammoth === 'undefined') {
                alert('DOCX parsing requires mammoth.js library.');
                return;
            }
            var arrayBuffer = await readFileAsArrayBuffer(file);
            var options = {
                arrayBuffer: arrayBuffer,
                styleMap: [
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Heading 3'] => h3:fresh",
                    "p[style-name='Title'] => h1.title:fresh",
                    "p[style-name='Subtitle'] => h2.subtitle:fresh",
                    "p[style-name='Normal'] => p:fresh"
                ],
                includeDefaultStyleMap: true,
            };
            var result = await mammoth.convertToHtml(options);
            content = result.value;
            format = 'html';
            console.log('DOCX messages:', result.messages);
        }

        if (content && content.trim()) {
            localStorage.setItem(UPLOAD_CONTENT_KEY, content);
            localStorage.setItem(UPLOAD_FORMAT_KEY, format);
            console.log('Stored upload (' + format + '):', content.substring(0, 200) + '...');

            setTimeout(function() {
                window.location.href = 'templates.html?upload=true';
            }, 100);
        } else {
            alert('No content found in the file.');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to process file: ' + error.message);
    }
}

/**
 * Extract text from PDF using pdf.js
 */
async function extractPDFText(file) {
    var arrayBuffer = await readFileAsArrayBuffer(file);
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var allText = '';

    for (var i = 1; i <= pdf.numPages; i++) {
        var page = await pdf.getPage(i);
        var content = await page.getTextContent();
        var pageText = content.items.map(function(item) {
            return item.str;
        }).join(' ');
        allText += pageText + '\n\n';
    }
    return allText;
}

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

/**
 * Retrieve uploaded content (called by templates.js)
 */
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
