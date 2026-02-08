// Upload Handler for Resume Files
// Supports PDF and DOCX file uploads

const UPLOAD_CONTENT_KEY = 'craftism-uploaded-content';

/**
 * Handle file upload
 * @param {File} file - The uploaded file
 */
async function handleFileUpload(file) {
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }

    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Check file type
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx') && !fileName.endsWith('.txt')) {
        alert('Please upload a PDF, DOCX, or TXT file.');
        return;
    }

    try {
        let extractedText = '';
        let htmlContent = '';

        if (fileName.endsWith('.txt')) {
            // Handle text files
            extractedText = await readTextFile(file);
            htmlContent = convertTextToHTML(extractedText);
        } else if (fileName.endsWith('.pdf')) {
            // Handle PDF files
            alert('PDF text extraction is not yet implemented. Please use TXT or DOCX files for now, or copy-paste your content directly into the editor.');
            return;
        } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            // Handle DOCX files using mammoth.js with enhanced style mapping
            try {
                const arrayBuffer = await readFileAsArrayBuffer(file);

                // Configure mammoth with comprehensive style mapping
                const options = {
                    arrayBuffer: arrayBuffer,
                    styleMap: [
                        // Headings with proper hierarchy
                        "p[style-name='Heading 1'] => h1:fresh",
                        "p[style-name='Heading 2'] => h2:fresh",
                        "p[style-name='Heading 3'] => h3:fresh",
                        "p[style-name='Heading 4'] => h4:fresh",
                        "p[style-name='Heading 5'] => h5:fresh",
                        "p[style-name='Heading 6'] => h6:fresh",

                        // Title and subtitle
                        "p[style-name='Title'] => h1.title:fresh",
                        "p[style-name='Subtitle'] => h2.subtitle:fresh",

                        // Text formatting
                        "r[style-name='Strong'] => strong",
                        "r[style-name='Emphasis'] => em",

                        // Lists
                        "p[style-name='List Paragraph'] => p.list-item:fresh",

                        // Normal paragraph
                        "p[style-name='Normal'] => p:fresh"
                    ],
                    // Preserve inline formatting
                    convertImage: mammoth.images.imgElement(function (image) {
                        return image.read("base64").then(function (imageBuffer) {
                            return {
                                src: "data:" + image.contentType + ";base64," + imageBuffer
                            };
                        });
                    }),
                    // Include default paragraph and run properties
                    includeDefaultStyleMap: true,
                    // Preserve emphasis marks
                    preserveEmphasis: true
                };

                const result = await mammoth.convertToHtml(options);
                htmlContent = result.value; // The generated HTML

                console.log('DOCX conversion messages:', result.messages);
                console.log('Raw HTML from DOCX:', htmlContent);

                // Enhanced cleanup to preserve formatting
                htmlContent = enhanceFormattedHTML(htmlContent);
                console.log('Enhanced HTML:', htmlContent);

            } catch (docxError) {
                console.error('DOCX extraction error:', docxError);
                alert('Failed to extract content from DOCX file. Please try a different file or use TXT format.');
                return;
            }
        }


        // Validate content
        if (htmlContent && htmlContent.trim()) {
            console.log('Extracted text:', extractedText || 'N/A (DOCX)');
            console.log('Converted HTML:', htmlContent);

            // Store in localStorage
            localStorage.setItem(UPLOAD_CONTENT_KEY, htmlContent);

            // Verify it was stored
            const stored = localStorage.getItem(UPLOAD_CONTENT_KEY);
            console.log('Stored content:', stored);

            // Small delay to ensure localStorage is written
            setTimeout(() => {
                // Redirect to createresume.html
                window.location.href = 'createresume.html?upload=true';
            }, 100);
        } else {
            alert('No content found in the file.');
        }
    } catch (error) {
        console.error('Error processing file:', error);
        alert('Failed to process the file. Please try again.');
    }
}

/**
 * Read file as ArrayBuffer (for DOCX files)
 * @param {File} file - The file to read
 * @returns {Promise<ArrayBuffer>} File content as ArrayBuffer
 */
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Read text file content
 * @param {File} file - The text file
 * @returns {Promise<string>} File content
 */
function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

/**
 * Convert plain text to HTML
 * @param {string} text - Plain text content
 * @returns {string} HTML content
 */
function convertTextToHTML(text) {
    // Split by double newlines to create paragraphs
    const paragraphs = text.split(/\n\n+/);

    let html = '';
    paragraphs.forEach(para => {
        const trimmed = para.trim();
        if (trimmed) {
            // Replace single newlines with <br>
            const formatted = trimmed.replace(/\n/g, '<br>');
            html += `<p>${formatted}</p>`;
        }
    });

    return html || '<p><br></p>';
}

/**
 * Enhance HTML content from DOCX conversion to preserve formatting
 * @param {string} html - Raw HTML from mammoth.js
 * @returns {string} Enhanced HTML content with preserved formatting
 */
function enhanceFormattedHTML(html) {
    if (!html) return '<p><br></p>';

    let enhanced = html;

    // Preserve line breaks and spacing
    enhanced = enhanced.replace(/<br\s*\/?>/gi, '<br>');

    // Ensure paragraphs have proper spacing
    enhanced = enhanced.replace(/<p>/gi, '<p style="margin-bottom: 0.5em;">');

    // Style headings to look like Word headings
    enhanced = enhanced.replace(/<h1>/gi, '<h1 style="font-size: 24pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; color: #000;">');
    enhanced = enhanced.replace(/<h2>/gi, '<h2 style="font-size: 18pt; font-weight: bold; margin-top: 10pt; margin-bottom: 4pt; color: #000;">');
    enhanced = enhanced.replace(/<h3>/gi, '<h3 style="font-size: 14pt; font-weight: bold; margin-top: 8pt; margin-bottom: 4pt; color: #000;">');
    enhanced = enhanced.replace(/<h4>/gi, '<h4 style="font-size: 12pt; font-weight: bold; margin-top: 6pt; margin-bottom: 3pt; color: #000;">');

    // Style lists properly
    enhanced = enhanced.replace(/<ul>/gi, '<ul style="margin-left: 20px; margin-bottom: 0.5em;">');
    enhanced = enhanced.replace(/<ol>/gi, '<ol style="margin-left: 20px; margin-bottom: 0.5em;">');
    enhanced = enhanced.replace(/<li>/gi, '<li style="margin-bottom: 0.25em;">');

    // Preserve bold, italic, underline
    enhanced = enhanced.replace(/<strong>/gi, '<strong style="font-weight: bold;">');
    enhanced = enhanced.replace(/<em>/gi, '<em style="font-style: italic;">');
    enhanced = enhanced.replace(/<u>/gi, '<u style="text-decoration: underline;">');

    // Remove completely empty paragraphs but keep ones with just <br>
    enhanced = enhanced.replace(/<p[^>]*>\s*<\/p>/g, '');

    // Ensure at least one paragraph exists
    if (!enhanced.trim() || enhanced.trim() === '') {
        return '<p><br></p>';
    }

    return enhanced;
}

/**
 * Clean up HTML content from DOCX conversion (legacy function)
 * @param {string} html - Raw HTML from mammoth.js
 * @returns {string} Cleaned HTML content
 */
function cleanupHTML(html) {
    // Redirect to enhanced function
    return enhanceFormattedHTML(html);
}


/**
 * Check if there's uploaded content to load
 * @returns {string|null} Uploaded content or null
 */
function getUploadedContent() {
    const content = localStorage.getItem(UPLOAD_CONTENT_KEY);
    if (content) {
        // Clear it after reading
        localStorage.removeItem(UPLOAD_CONTENT_KEY);
        return content;
    }
    return null;
}
