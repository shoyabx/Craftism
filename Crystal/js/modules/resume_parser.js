// ══════════════════════════════════════════════════════
// RESUME PARSER — Raw text/HTML → Structured JSON
// ATS ANALYZER  — Score + improvement flags
// ══════════════════════════════════════════════════════

// ── SECTION HEADING PATTERNS ─────────────────────────
var SECTION_PATTERNS = {
    summary:        /^(summary|profile|objective|about\s*me|professional\s*summary|career\s*objective)/i,
    experience:     /^(experience|work\s*experience|employment|professional\s*experience|work\s*history)/i,
    education:      /^(education|academic|qualifications|educational\s*background)/i,
    skills:         /^(skills|technical\s*skills|core\s*competencies|competencies|technologies|expertise)/i,
    projects:       /^(projects|personal\s*projects|key\s*projects|notable\s*projects)/i,
    certifications: /^(certifications?|licenses?|credentials|certifications?\s*&?\s*licenses?)/i,
    languages:      /^(languages)/i,
    awards:         /^(awards|honors|achievements)/i,
};

// Date patterns for experience/education
var DATE_PATTERN = /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{2,4}\s*(?:[-\u2013\u2014]\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{2,4})?)?|\b\d{4}\s*[-\u2013\u2014]\s*(?:present|current|\d{4})|\b\d{4}\b)/i;

// ══════════════════════════════════════════════════════
// 1. TEXT EXTRACTION — HTML → clean lines
// ══════════════════════════════════════════════════════
function htmlToLines(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    // Convert block elements to newlines
    tmp.querySelectorAll('br').forEach(function(br) { br.replaceWith('\n'); });
    tmp.querySelectorAll('p,div,h1,h2,h3,h4,h5,h6,li,tr').forEach(function(el) {
        el.prepend(document.createTextNode('\n'));
    });
    var text = tmp.textContent || tmp.innerText || '';
    return text.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
}

function plainTextToLines(text) {
    return text.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
}

// ══════════════════════════════════════════════════════
// 2. HEADER EXTRACTION — First block before any section
// ══════════════════════════════════════════════════════
var EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/;
var PHONE_RE = /(\+?\d[\d\s\-().]{7,}\d)/;
var LINKEDIN_RE = /(linkedin\.com\/in\/[\w-]+)/i;
var WEBSITE_RE = /((?:https?:\/\/)?[\w]+\.[\w.]+(?:\/[\w-]*)*)/i;

function extractHeader(lines) {
    var header = { name: '', title: '', email: '', phone: '', location: '', linkedin: '', website: '' };
    var consumed = 0;

    // First non-empty line is likely the name
    for (var i = 0; i < Math.min(lines.length, 8); i++) {
        var line = lines[i];

        // Check for email
        var em = line.match(EMAIL_RE);
        if (em) { header.email = em[0]; consumed = Math.max(consumed, i + 1); continue; }

        // Check for phone
        var ph = line.match(PHONE_RE);
        if (ph && !isSectionHeading(line)) { header.phone = ph[1].trim(); consumed = Math.max(consumed, i + 1); continue; }

        // Check for LinkedIn
        var li = line.match(LINKEDIN_RE);
        if (li) { header.linkedin = li[1]; consumed = Math.max(consumed, i + 1); continue; }

        // Check for location patterns (City, ST or City, State)
        if (/^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2}$/.test(line) || /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z][a-z]/.test(line)) {
            header.location = line; consumed = Math.max(consumed, i + 1); continue;
        }

        // Check if this is a section heading — stop
        if (isSectionHeading(line)) break;

        // First unmatched line = name
        if (!header.name) { header.name = line; consumed = Math.max(consumed, i + 1); continue; }

        // Second unmatched line = title (if short enough)
        if (!header.title && line.length < 80 && !line.match(EMAIL_RE) && !line.match(PHONE_RE)) {
            header.title = line; consumed = Math.max(consumed, i + 1); continue;
        }

        // Third+ = probably location or misc contact
        if (!header.location && line.length < 50) {
            // Check for website
            var ws = line.match(WEBSITE_RE);
            if (ws && !header.website) { header.website = ws[1]; consumed = Math.max(consumed, i + 1); continue; }
            header.location = line; consumed = Math.max(consumed, i + 1);
        }
    }
    return { header: header, consumed: consumed };
}

// ══════════════════════════════════════════════════════
// 3. SECTION IDENTIFICATION
// ══════════════════════════════════════════════════════
function isSectionHeading(line) {
    var clean = line.replace(/[:\-\u2013\u2014|]/g, '').trim();
    for (var key in SECTION_PATTERNS) {
        if (SECTION_PATTERNS[key].test(clean)) return key;
    }
    return null;
}

function segmentSections(lines, startIdx) {
    var sections = [];
    var current = null;

    for (var i = startIdx; i < lines.length; i++) {
        var heading = isSectionHeading(lines[i]);
        if (heading) {
            if (current) sections.push(current);
            current = { type: heading, lines: [] };
        } else if (current) {
            current.lines.push(lines[i]);
        }
    }
    if (current) sections.push(current);
    return sections;
}

// ══════════════════════════════════════════════════════
// 4. SECTION PARSERS
// ══════════════════════════════════════════════════════
function parseSummary(lines) {
    return { text: lines.join(' ') };
}

function parseExperience(lines) {
    var items = [];
    var current = null;
    var idCounter = 1;

    lines.forEach(function(line) {
        var dateMatch = line.match(DATE_PATTERN);
        // Heuristic: line with a date is a new entry header
        if (dateMatch && (line.length < 120 || !current)) {
            if (current) items.push(current);
            var dur = dateMatch[0];
            var rest = line.replace(dur, '').replace(/[|,\u2013\u2014-]+\s*$/, '').replace(/^\s*[|,\u2013\u2014-]+/, '').trim();
            // Try to split role and company by common delimiters
            var parts = rest.split(/\s+(?:at|@|\|)\s+|,\s+|\s+[-\u2013\u2014]\s+/);
            current = {
                id: 'e' + idCounter++,
                role: parts[0] || rest,
                company: parts[1] || '',
                duration: dur,
                description: ''
            };
        } else if (current) {
            current.description += (current.description ? ' ' : '') + line;
        } else {
            // Line before first date — might be role or company
            if (!current) {
                current = { id: 'e' + idCounter++, role: line, company: '', duration: '', description: '' };
            }
        }
    });
    if (current) items.push(current);
    return items;
}

function parseEducation(lines) {
    var items = [];
    var current = null;
    var idCounter = 1;

    lines.forEach(function(line) {
        var dateMatch = line.match(/\b(19|20)\d{2}\b/);
        // Degree keywords
        var isDegree = /\b(B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|Ph\.?D|MBA|Bachelor|Master|Associate|Diploma|Certificate)\b/i.test(line);

        if (isDegree || (dateMatch && line.length < 100 && !current)) {
            if (current) items.push(current);
            var yr = dateMatch ? dateMatch[0] : '';
            current = { id: 'edu' + idCounter++, degree: line.replace(yr, '').replace(/[,|]\s*$/, '').trim(), institution: '', year: yr, gpa: '' };
        } else if (current) {
            if (!current.institution) {
                current.institution = line;
            } else {
                var gpaMatch = line.match(/GPA[:\s]*([0-9.]+)/i);
                if (gpaMatch) current.gpa = gpaMatch[1];
            }
        }
    });
    if (current) items.push(current);
    return items;
}

function parseSkills(lines) {
    var groups = [];
    var idCounter = 1;
    var allItems = [];

    lines.forEach(function(line) {
        // Check for "Category: item1, item2" pattern
        var catMatch = line.match(/^([^:]+):\s*(.+)/);
        if (catMatch) {
            var items = catMatch[2].split(/[,;|]+/).map(function(s) { return s.trim(); }).filter(function(s) { return s; });
            groups.push({ id: 'sk' + idCounter++, category: catMatch[1].trim(), items: items });
        } else {
            // Comma-separated list without category
            var skills = line.split(/[,;|]+/).map(function(s) { return s.trim(); }).filter(function(s) { return s && s.length < 40; });
            if (skills.length > 1) {
                allItems = allItems.concat(skills);
            } else if (line.length < 40) {
                allItems.push(line);
            }
        }
    });

    // If we have uncategorized skills, group them
    if (allItems.length > 0 && groups.length === 0) {
        groups.push({ id: 'sk' + idCounter++, category: 'Skills', items: allItems });
    } else if (allItems.length > 0) {
        groups.push({ id: 'sk' + idCounter++, category: 'Other', items: allItems });
    }

    return groups;
}

function parseProjects(lines) {
    var items = [];
    var current = null;
    var idCounter = 1;

    lines.forEach(function(line) {
        // Short lines are likely project names
        if (line.length < 60 && !current) {
            current = { id: 'pr' + idCounter++, name: line, description: '', url: '' };
        } else if (line.length < 60 && current && current.description) {
            items.push(current);
            current = { id: 'pr' + idCounter++, name: line, description: '', url: '' };
        } else if (current) {
            var urlMatch = line.match(WEBSITE_RE);
            if (urlMatch && line.length < 80) {
                current.url = urlMatch[1];
            } else {
                current.description += (current.description ? ' ' : '') + line;
            }
        }
    });
    if (current) items.push(current);
    return items;
}

function parseCertifications(lines) {
    var items = [];
    var idCounter = 1;

    lines.forEach(function(line) {
        if (line.length < 5) return;
        var yearMatch = line.match(/\b(19|20)\d{2}\b/);
        var parts = line.replace(yearMatch ? yearMatch[0] : '', '').split(/[,\u2013\u2014|-]+/);
        items.push({
            id: 'ce' + idCounter++,
            name: (parts[0] || line).trim(),
            issuer: (parts[1] || '').trim(),
            year: yearMatch ? yearMatch[0] : ''
        });
    });
    return items;
}

// ══════════════════════════════════════════════════════
// 5. MAIN PARSER — Orchestrates everything
// ══════════════════════════════════════════════════════
function parseResumeText(input, isHTML) {
    var lines = isHTML ? htmlToLines(input) : plainTextToLines(input);
    if (lines.length === 0) return null;

    // Step 1: Extract header
    var headerResult = extractHeader(lines);

    // Step 2: Segment remaining lines into sections
    var raw = segmentSections(lines, headerResult.consumed);

    // Step 3: Parse each section
    var resume = {
        header: headerResult.header,
        summary: { text: '' },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: []
    };

    var sectionsFound = [];
    raw.forEach(function(sec) {
        sectionsFound.push(sec.type);
        switch (sec.type) {
            case 'summary':        resume.summary = parseSummary(sec.lines); break;
            case 'experience':     resume.experience = parseExperience(sec.lines); break;
            case 'education':      resume.education = parseEducation(sec.lines); break;
            case 'skills':         resume.skills = parseSkills(sec.lines); break;
            case 'projects':       resume.projects = parseProjects(sec.lines); break;
            case 'certifications': resume.certifications = parseCertifications(sec.lines); break;
        }
    });

    // Build sections visibility list
    var sections = [
        { id: 'header',         label: 'Header',         visible: true },
        { id: 'summary',        label: 'Summary',        visible: resume.summary.text.length > 0 },
        { id: 'experience',     label: 'Experience',     visible: resume.experience.length > 0 },
        { id: 'education',      label: 'Education',      visible: resume.education.length > 0 },
        { id: 'skills',         label: 'Skills',         visible: resume.skills.length > 0 },
        { id: 'projects',       label: 'Projects',       visible: resume.projects.length > 0 },
        { id: 'certifications', label: 'Certifications', visible: resume.certifications.length > 0 },
    ];

    return {
        resume: resume,
        sections: sections,
        metadata: {
            linesTotal: lines.length,
            sectionsFound: sectionsFound,
            parseTimestamp: new Date().toISOString()
        }
    };
}

// ══════════════════════════════════════════════════════
// 6. ATS ANALYZER
// ══════════════════════════════════════════════════════
var ATS_RULES = [
    { id: 'has_name',        weight: 10, check: function(r) { return r.header.name.length > 1; },           pass: 'Name present',              fail: 'Missing name' },
    { id: 'has_email',       weight: 10, check: function(r) { return EMAIL_RE.test(r.header.email); },      pass: 'Valid email',                fail: 'Missing or invalid email' },
    { id: 'has_phone',       weight: 8,  check: function(r) { return r.header.phone.length > 6; },          pass: 'Phone number present',       fail: 'Missing phone number' },
    { id: 'has_summary',     weight: 10, check: function(r) { return r.summary.text.length > 20; },         pass: 'Professional summary',       fail: 'Add a professional summary (2-4 sentences)' },
    { id: 'has_experience',  weight: 15, check: function(r) { return r.experience.length > 0; },            pass: 'Work experience listed',     fail: 'No work experience found' },
    { id: 'exp_details',     weight: 10, check: function(r) { return r.experience.every(function(e) { return e.description.length > 20; }); }, pass: 'Experience has descriptions', fail: 'Add bullet-point descriptions to each role' },
    { id: 'exp_dates',       weight: 8,  check: function(r) { return r.experience.every(function(e) { return e.duration.length > 3; }); },     pass: 'Experience has dates',        fail: 'Add dates to each position' },
    { id: 'has_education',   weight: 10, check: function(r) { return r.education.length > 0; },             pass: 'Education listed',           fail: 'No education section found' },
    { id: 'has_skills',      weight: 12, check: function(r) { return r.skills.length > 0; },                pass: 'Skills section present',     fail: 'Add a skills section with relevant keywords' },
    { id: 'skills_count',    weight: 7,  check: function(r) { var c=0; r.skills.forEach(function(g){c+=g.items.length;}); return c >= 5; }, pass: '5+ skills listed', fail: 'List at least 5 relevant skills' },
];

function analyzeATS(resumeData) {
    var score = 0;
    var maxScore = 0;
    var flags = [];

    ATS_RULES.forEach(function(rule) {
        maxScore += rule.weight;
        var passed = false;
        try { passed = rule.check(resumeData); } catch(e) { passed = false; }
        if (passed) {
            score += rule.weight;
            flags.push({ id: rule.id, status: 'pass', message: rule.pass, weight: rule.weight });
        } else {
            flags.push({ id: rule.id, status: 'fail', message: rule.fail, weight: rule.weight });
        }
    });

    var percentage = Math.round((score / maxScore) * 100);
    var grade = percentage >= 85 ? 'A' : percentage >= 70 ? 'B' : percentage >= 50 ? 'C' : 'D';

    return {
        score: percentage,
        grade: grade,
        maxPoints: maxScore,
        earnedPoints: score,
        flags: flags,
        analyzedAt: new Date().toISOString()
    };
}

// ══════════════════════════════════════════════════════
// 7. EXPORTS — Available to templates.js
// ══════════════════════════════════════════════════════
// parseResumeText(input, isHTML) → { resume, sections, metadata }
// analyzeATS(resumeData) → { score, grade, flags }
