// ══════════════════════════════════════════════════════
// RESUME BUILDER — Complete JS Module
// ══════════════════════════════════════════════════════

// ── 0. FONTS & TEMPLATE PRESETS ──────────────────────
const FONTS = [
    { name: 'Inter',             stack: 'sans-serif', label: 'Inter \u2014 Modern' },
    { name: 'Roboto',            stack: 'sans-serif', label: 'Roboto \u2014 Clean' },
    { name: 'Lato',              stack: 'sans-serif', label: 'Lato \u2014 Friendly' },
    { name: 'Source Serif 4',    stack: 'serif',      label: 'Source Serif \u2014 Classic' },
    { name: 'Merriweather',      stack: 'serif',      label: 'Merriweather \u2014 Elegant' },
    { name: 'Playfair Display',  stack: 'serif',      label: 'Playfair \u2014 Prestige' },
    { name: 'Crimson Pro',       stack: 'serif',      label: 'Crimson \u2014 Scholarly' },
    { name: 'Libre Baskerville', stack: 'serif',      label: 'Baskerville \u2014 Timeless' },
];

const TEMPLATES = {
    classic:      { name:'Classic',       desc:'ATS-safe serif',      layout:'single',  font:'Source Serif 4',   fontStack:'serif',      color:'#1a3c5e', fontSize:'md', density:'standard' },
    modern:       { name:'Modern',        desc:'Clean sans-serif',    layout:'single',  font:'Inter',            fontStack:'sans-serif', color:'#334155', fontSize:'md', density:'standard' },
    executive:    { name:'Executive',     desc:'Two-column navy',     layout:'two',     font:'Merriweather',     fontStack:'serif',      color:'#1a3c5e', fontSize:'md', density:'standard' },
    minimal:      { name:'Minimal',       desc:'Dense & compact',     layout:'compact', font:'Roboto',           fontStack:'sans-serif', color:'#334155', fontSize:'sm', density:'compact' },
    creative:     { name:'Creative',      desc:'Bold sidebar',        layout:'two',     font:'Lato',             fontStack:'sans-serif', color:'#4c1d95', fontSize:'md', density:'standard' },
    professional: { name:'Professional',  desc:'Forest green tone',   layout:'single',  font:'Crimson Pro',      fontStack:'serif',      color:'#1a4731', fontSize:'md', density:'standard' },
    elegant:      { name:'Elegant',       desc:'Serif prestige',      layout:'single',  font:'Playfair Display', fontStack:'serif',      color:'#7c2d12', fontSize:'lg', density:'airy' },
    academic:     { name:'Academic',      desc:'Traditional serif',   layout:'single',  font:'Libre Baskerville',fontStack:'serif',      color:'#0f4c75', fontSize:'md', density:'standard' },
};

// ── 1. DATA MODEL ────────────────────────────────────
const state = {
    settings: {
        layout:'single', font:'Inter', fontStack:'sans-serif',
        fontSize:'md', color:'#1a3c5e', density:'standard',
        paper:'a4', template:'classic',
    },
    sections: [
        { id:'header',         label:'Header',         visible:true  },
        { id:'summary',        label:'Summary',        visible:true  },
        { id:'experience',     label:'Experience',     visible:true  },
        { id:'education',      label:'Education',      visible:true  },
        { id:'skills',         label:'Skills',         visible:true  },
        { id:'projects',       label:'Projects',       visible:false },
        { id:'certifications', label:'Certifications', visible:false },
    ],
    resume: {
        header: { name:'Alex Johnson', title:'Senior Software Engineer', email:'alex@email.com', phone:'+1 (555) 000-0000', location:'San Francisco, CA', linkedin:'linkedin.com/in/alexj', website:'alexjohnson.dev' },
        summary: { text:'Results-driven engineer with 6+ years building scalable web products. Passionate about clean architecture, developer experience, and shipping software users love.' },
        experience: [
            { id:'e1', role:'Senior Software Engineer', company:'Acme Corp', duration:'Jan 2022 \u2014 Present', description:'Led microservices platform serving 2M+ users. Cut API latency 40% via caching and query optimization.' },
            { id:'e2', role:'Software Engineer', company:'Startup XYZ', duration:'Jun 2019 \u2014 Dec 2021', description:'Grew React/Node.js SaaS from 0 to 50K users. Built CI/CD pipeline, reducing deploy time by 60%.' },
        ],
        education: [{ id:'edu1', degree:'B.S. Computer Science', institution:'UC Berkeley', year:'2019', gpa:'3.8' }],
        skills: [
            { id:'sk1', category:'Languages', items:['TypeScript','Python','Go','SQL'] },
            { id:'sk2', category:'Frameworks', items:['React','Node.js','FastAPI','Docker'] },
            { id:'sk3', category:'Cloud & Tools', items:['AWS','PostgreSQL','Redis','Git'] },
        ],
        projects: [{ id:'pr1', name:'OpenSearch CLI', description:'Open-source CLI for Elasticsearch. 800+ GitHub stars.', url:'github.com/alexj/opensearch-cli' }],
        certifications: [
            { id:'ce1', name:'AWS Solutions Architect', issuer:'Amazon Web Services', year:'2023' },
            { id:'ce2', name:'Google Cloud Professional', issuer:'Google', year:'2022' },
        ],
    }
};

let currentResumeId = null;
const SIDEBAR_IDS = ['header','skills','education','certifications'];

// ── 2. SECTION RENDERERS ─────────────────────────────
const R = {
    header(d, lay) {
        const ct = (f,v) => `<span contenteditable data-f="${f}">${v}</span>`;
        if (lay === 'two') return `<div class="r-section" id="sec-header"><div class="r-name" contenteditable data-f="header.name">${d.name}</div><div class="r-title" contenteditable data-f="header.title">${d.title}</div><div class="r-contact" style="margin-top:10px;display:flex;flex-direction:column;gap:3px;">${ct('header.email',d.email)}${ct('header.phone',d.phone)}${ct('header.location',d.location)}${ct('header.linkedin',d.linkedin)}${d.website?ct('header.website',d.website):''}</div></div>`;
        if (lay === 'compact') return `<div class="r-header" id="sec-header"><div><div class="r-name" contenteditable data-f="header.name">${d.name}</div><div class="r-title" contenteditable data-f="header.title">${d.title}</div></div><div class="r-header-right"><div class="r-contact-item" contenteditable data-f="header.email">${d.email}</div><div class="r-contact-item" contenteditable data-f="header.phone">${d.phone}</div><div class="r-contact-item" contenteditable data-f="header.location">${d.location}</div></div></div>`;
        return `<div class="r-header" id="sec-header"><div class="r-name" contenteditable data-f="header.name">${d.name}</div><div class="r-title" contenteditable data-f="header.title">${d.title}</div><div class="r-contact-row"><span class="r-contact-item" contenteditable data-f="header.email">${d.email}</span><span class="r-contact-item" contenteditable data-f="header.phone">${d.phone}</span><span class="r-contact-item" contenteditable data-f="header.location">${d.location}</span><span class="r-contact-item" contenteditable data-f="header.linkedin">${d.linkedin}</span>${d.website?`<span class="r-contact-item" contenteditable data-f="header.website">${d.website}</span>`:''}</div></div>`;
    },
    summary(d) { return `<div class="r-section" id="sec-summary"><div class="sec-title">Summary</div><div class="summary-text" contenteditable data-f="summary.text">${d.text}</div></div>`; },
    experience(items) { return `<div class="r-section" id="sec-experience"><div class="sec-title">Experience</div>${items.map(e=>`<div class="exp-item"><div class="exp-head"><span class="exp-role" contenteditable data-f="exp.${e.id}.role">${e.role}</span><span class="exp-dur" contenteditable data-f="exp.${e.id}.duration">${e.duration}</span></div><div class="exp-co" contenteditable data-f="exp.${e.id}.company">${e.company}</div><div class="exp-desc" contenteditable data-f="exp.${e.id}.description">${e.description}</div></div>`).join('')}</div>`; },
    education(items) { return `<div class="r-section" id="sec-education"><div class="sec-title">Education</div>${items.map(e=>`<div class="edu-item"><div class="edu-head"><span class="edu-deg" contenteditable data-f="edu.${e.id}.degree">${e.degree}</span><span class="edu-yr" contenteditable data-f="edu.${e.id}.year">${e.year}</span></div><div class="edu-inst" contenteditable data-f="edu.${e.id}.institution">${e.institution}</div></div>`).join('')}</div>`; },
    skills(groups) { return `<div class="r-section" id="sec-skills"><div class="sec-title">Skills</div>${groups.map(g=>`<div class="skill-group"><div class="skill-cat" contenteditable data-f="sk.${g.id}.category">${g.category}</div><div class="skill-tags">${g.items.map(i=>`<span class="skill-tag" contenteditable>${i}</span>`).join('')}</div></div>`).join('')}</div>`; },
    projects(items) { return `<div class="r-section" id="sec-projects"><div class="sec-title">Projects</div>${items.map(p=>`<div class="exp-item"><div class="exp-role" contenteditable data-f="pr.${p.id}.name">${p.name}</div><div class="exp-desc" contenteditable data-f="pr.${p.id}.description">${p.description}</div>${p.url?`<div class="r-contact-item" style="margin-top:2px" contenteditable data-f="pr.${p.id}.url">${p.url}</div>`:''}</div>`).join('')}</div>`; },
    certifications(items) { return `<div class="r-section" id="sec-certifications"><div class="sec-title">Certifications</div>${items.map(c=>`<div class="cert-item"><div><div class="cert-name" contenteditable data-f="ce.${c.id}.name">${c.name}</div><div class="cert-meta" contenteditable data-f="ce.${c.id}.issuer">${c.issuer}</div></div><div class="cert-meta" contenteditable data-f="ce.${c.id}.year">${c.year}</div></div>`).join('')}</div>`; },
};

function getSectionHTML(id, lay) {
    const r = state.resume;
    const m = { header:()=>R.header(r.header,lay), summary:()=>R.summary(r.summary), experience:()=>R.experience(r.experience), education:()=>R.education(r.education), skills:()=>R.skills(r.skills), projects:()=>R.projects(r.projects), certifications:()=>R.certifications(r.certifications) };
    return (m[id]||(() => ''))();
}

// ── 3. LAYOUT BUILDERS ──────────────────────────────
function buildLayoutHTML(lay) {
    const vis = state.sections.filter(s=>s.visible).map(s=>s.id);
    if (lay === 'two') {
        const sb = vis.filter(id=>SIDEBAR_IDS.includes(id));
        const mn = vis.filter(id=>!SIDEBAR_IDS.includes(id));
        return '<div class="lay-two"><div class="r-sidebar">'+sb.map(id=>getSectionHTML(id,'two')).join('')+'</div><div class="r-main">'+mn.map(id=>getSectionHTML(id,'two')).join('')+'</div></div>';
    }
    if (lay === 'compact') return '<div class="lay-compact">'+vis.map(id=>getSectionHTML(id,'compact')).join('')+'</div>';
    return '<div class="lay-single">'+vis.map(id=>getSectionHTML(id,'single')).join('')+'</div>';
}

// ── 4. CORE RENDER ──────────────────────────────────
function render() {
    const s = state.settings;
    const root = document.documentElement;
    root.style.setProperty('--r-primary', s.color);
    root.style.setProperty('--r-font', "'"+s.font+"', "+s.fontStack);

    document.getElementById('resume-preview').innerHTML =
        '<div class="resume-paper paper-'+s.paper+' fs-'+s.fontSize+' dn-'+s.density+'" id="r-paper">'+buildLayoutHTML(s.layout)+'</div>';

    attachEditSync();
    renderSecList();
    renderFontList();
    renderTplGrid();
    syncControlsUI();
}

// ── 5. INLINE EDIT SYNC ─────────────────────────────
function attachEditSync() {
    document.querySelectorAll('[contenteditable][data-f]').forEach(function(el) {
        el.addEventListener('input', function() { syncField(el.dataset.f, el.innerText.trim()); });
    });
}
function syncField(path, val) {
    var parts = path.split('.');
    var ns = parts[0], id = parts[1], key = parts[2];
    var r = state.resume;
    if (ns === 'header')  { r.header[id] = val; return; }
    if (ns === 'summary') { r.summary.text = val; return; }
    var maps = { exp:r.experience, edu:r.education, pr:r.projects, ce:r.certifications, sk:r.skills };
    var arr = maps[ns];
    if (arr) { var item = arr.find(function(x){return x.id===id;}); if (item && key) item[key] = val; }
}

// ── 6. SECTION REORDER ──────────────────────────────
function renderSecList() {
    var html = '';
    state.sections.forEach(function(s, i) {
        html += '<div class="sec-row '+(s.visible?'':'off')+'">';
        html += '<input type="checkbox" '+(s.visible?'checked':'')+' onchange="toggleSec('+i+',this.checked)">';
        html += '<span class="sec-name">'+s.label+'</span>';
        html += '<div class="sec-arrows">';
        html += '<button class="arr-btn" onclick="moveSec('+i+',-1)" '+(i===0?'disabled':'')+'>&#8593;</button>';
        html += '<button class="arr-btn" onclick="moveSec('+i+',1)" '+(i===state.sections.length-1?'disabled':'')+'>&#8595;</button>';
        html += '</div></div>';
    });
    document.getElementById('sec-list').innerHTML = html;
}
function toggleSec(i, v) { state.sections[i].visible = v; render(); }
function moveSec(i, dir) {
    var j = i + dir;
    if (j < 0 || j >= state.sections.length) return;
    var tmp = state.sections[i];
    state.sections[i] = state.sections[j];
    state.sections[j] = tmp;
    render();
}

// ── 7. FONT LIST ────────────────────────────────────
function renderFontList() {
    var html = '';
    FONTS.forEach(function(f) {
        var active = state.settings.font === f.name ? ' active' : '';
        html += '<div class="font-opt'+active+'" style="font-family:\''+f.name+'\','+f.stack+'" data-font="'+f.name+'" onclick="setFont(\''+f.name+'\',\''+f.stack+'\')">'+f.label+'</div>';
    });
    document.getElementById('font-list').innerHTML = html;
}

// ── 8. TEMPLATE PRESETS ─────────────────────────────
function renderTplGrid() {
    var html = '';
    Object.keys(TEMPLATES).forEach(function(id) {
        var t = TEMPLATES[id];
        var active = state.settings.template === id ? ' active' : '';
        html += '<div class="tpl-btn'+active+'" onclick="applyTemplate(\''+id+'\')"><div class="tpl-name">'+t.name+'</div><div class="tpl-desc">'+t.desc+'</div></div>';
    });
    document.getElementById('tpl-grid').innerHTML = html;
}
function applyTemplate(id) {
    var t = TEMPLATES[id]; if (!t) return;
    state.settings.layout = t.layout;
    state.settings.font = t.font;
    state.settings.fontStack = t.fontStack;
    state.settings.color = t.color;
    state.settings.fontSize = t.fontSize;
    state.settings.density = t.density;
    state.settings.template = id;
    render();
}

// ── 9. SETTINGS CONTROLS ────────────────────────────
function syncControlsUI() {
    var s = state.settings;
    document.querySelectorAll('.lay-btn').forEach(function(b){b.classList.toggle('active',b.dataset.lay===s.layout);});
    document.querySelectorAll('[data-sz]').forEach(function(b){b.classList.toggle('active',b.dataset.sz===s.fontSize);});
    document.querySelectorAll('[data-dn]').forEach(function(b){b.classList.toggle('active',b.dataset.dn===s.density);});
    document.querySelectorAll('[data-paper]').forEach(function(b){b.classList.toggle('active',b.dataset.paper===s.paper);});
    document.querySelectorAll('.swatch').forEach(function(sw){sw.classList.toggle('active',sw.dataset.color===s.color);});
    document.getElementById('custom-color').value = s.color;
}

function setLayout(lay) { state.settings.layout = lay; state.settings.template = ''; render(); }
function setFont(font, stack) { state.settings.font = font; state.settings.fontStack = stack; state.settings.template = ''; render(); }
function setSize(sz) {
    state.settings.fontSize = sz;
    var p = document.getElementById('r-paper');
    if (p) { p.classList.remove('fs-sm','fs-md','fs-lg'); p.classList.add('fs-'+sz); }
    document.querySelectorAll('[data-sz]').forEach(function(b){b.classList.toggle('active',b.dataset.sz===sz);});
}
function setColor(color, fromInput) {
    state.settings.color = color; state.settings.template = '';
    document.documentElement.style.setProperty('--r-primary', color);
    document.querySelectorAll('.swatch').forEach(function(s){s.classList.toggle('active',s.dataset.color===color);});
    if (!fromInput) document.getElementById('custom-color').value = color;
    renderTplGrid();
}
function setDensity(dn) {
    state.settings.density = dn;
    var p = document.getElementById('r-paper');
    if (p) { p.classList.remove('dn-compact','dn-standard','dn-airy'); p.classList.add('dn-'+dn); }
    document.querySelectorAll('[data-dn]').forEach(function(b){b.classList.toggle('active',b.dataset.dn===dn);});
}

// ── Paper Size ──
function setPaper(sz) {
    state.settings.paper = sz;
    var p = document.getElementById('r-paper');
    if (p) { p.classList.remove('paper-a4','paper-letter'); p.classList.add('paper-'+sz); }
    document.querySelectorAll('[data-paper]').forEach(function(b){b.classList.toggle('active',b.dataset.paper===sz);});
    var style = document.getElementById('page-style');
    if (!style) { style = document.createElement('style'); style.id = 'page-style'; document.head.appendChild(style); }
    style.textContent = '@page { size: '+(sz==='letter'?'letter':'A4')+'; margin: 15mm; }';
}

// ── Print ──
function printResume() {
    setPaper(state.settings.paper);
    setTimeout(function() { window.print(); }, 100);
}

// ── 10. SUPABASE SAVE / LOAD ────────────────────────
function setStatus(msg, isError) {
    var el = document.getElementById('save-status');
    el.textContent = msg;
    el.style.color = isError ? '#dc2626' : '#16a34a';
    if (msg) setTimeout(function(){ if(el.textContent===msg) el.textContent=''; }, 4000);
}

async function saveResume() {
    var user = await checkAuthState();
    if (!user) { setStatus('Not logged in', true); return; }
    var payload = { resume: state.resume, settings: state.settings, sections: state.sections };
    try {
        if (currentResumeId) {
            var res = await supabaseClient.from('resumes').update({ title: state.resume.header.name + "'s Resume", content: payload, updated_at: new Date().toISOString() }).eq('id', currentResumeId);
            if (res.error) throw res.error;
            setStatus('Updated');
        } else {
            var res2 = await supabaseClient.from('resumes').insert({ user_id: user.id, title: state.resume.header.name + "'s Resume", content: payload }).select().single();
            if (res2.error) throw res2.error;
            currentResumeId = res2.data.id;
            setStatus('Saved');
        }
    } catch(e) { console.error(e); setStatus('Save failed: ' + e.message, true); }
}

async function loadResumes() {
    var user = await checkAuthState();
    if (!user) { setStatus('Not logged in', true); return; }
    try {
        var res = await supabaseClient.from('resumes').select('id,title,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(10);
        if (res.error) throw res.error;
        if (!res.data.length) { setStatus('No saved resumes'); return; }
        var html = '';
        res.data.forEach(function(r) {
            var d = new Date(r.updated_at).toLocaleDateString();
            html += '<div class="saved-item" onclick="loadResume(\''+r.id+'\')"><span class="si-name">'+(r.title||'Untitled')+'</span><span class="si-date">'+d+'</span></div>';
        });
        document.getElementById('saved-list').innerHTML = html;
    } catch(e) { console.error(e); setStatus('Load failed: ' + e.message, true); }
}

async function loadResume(id) {
    try {
        var res = await supabaseClient.from('resumes').select('*').eq('id', id).single();
        if (res.error) throw res.error;
        var c = res.data.content;
        if (c.resume) Object.assign(state.resume, c.resume);
        if (c.settings) Object.assign(state.settings, c.settings);
        if (c.sections) { state.sections.length = 0; c.sections.forEach(function(s){ state.sections.push(s); }); }
        currentResumeId = id;
        setStatus('Loaded: ' + (res.data.title || 'Untitled'));
        document.getElementById('saved-list').innerHTML = '';
        render();
    } catch(e) { console.error(e); setStatus('Load failed: ' + e.message, true); }
}

// ── 11. UPLOAD INTEGRATION ──────────────────────────
var uploadATSResult = null;
var uploadMode = 'template'; // 'original' | 'template'

function initUploadZone() {
    var zone = document.getElementById('upload-zone');
    var input = document.getElementById('upload-input');
    if (!zone || !input) return;

    zone.addEventListener('click', function() { input.click(); });
    zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', function() { zone.classList.remove('drag-over'); });
    zone.addEventListener('drop', function(e) {
        e.preventDefault();
        zone.classList.remove('drag-over');
        var file = e.dataTransfer.files[0];
        if (file) processUploadedFile(file);
    });
    input.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file) processUploadedFile(file);
    });
}

async function processUploadedFile(file) {
    var zone = document.getElementById('upload-zone');
    zone.innerHTML = '<div class="uz-icon"><i class="ph ph-spinner"></i></div><div class="uz-text">Processing ' + file.name + '...</div>';

    var fileName = file.name.toLowerCase();
    var content = '';
    var isHTML = false;

    try {
        if (fileName.endsWith('.txt')) {
            content = await readTextFile(file);
        } else if (fileName.endsWith('.pdf')) {
            if (typeof pdfjsLib !== 'undefined') {
                content = await extractPDFText(file);
            } else {
                alert('PDF parsing library not loaded.'); resetUploadZone(); return;
            }
        } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            if (typeof mammoth === 'undefined') {
                alert('DOCX parsing library not loaded.'); resetUploadZone(); return;
            }
            var buf = await readFileAsArrayBuffer(file);
            var result = await mammoth.convertToHtml({ arrayBuffer: buf, includeDefaultStyleMap: true });
            content = result.value;
            isHTML = true;
        } else {
            alert('Unsupported file type.'); resetUploadZone(); return;
        }

        if (!content || !content.trim()) {
            alert('No content found in file.'); resetUploadZone(); return;
        }

        // Store raw content for "Original Mode"
        uploadedRawContent = content;
        uploadedIsHTML = isHTML;

        // Parse into structured JSON
        var parsed = parseResumeText(content, isHTML);
        if (!parsed) { alert('Could not parse resume content.'); resetUploadZone(); return; }

        // Inject into state
        Object.assign(state.resume, parsed.resume);
        state.sections.length = 0;
        parsed.sections.forEach(function(s) { state.sections.push(s); });

        // Run ATS analysis
        uploadATSResult = analyzeATS(parsed.resume);

        // Update UI
        zone.innerHTML = '<div class="uz-icon" style="color:#16a34a;"><i class="ph ph-check-circle"></i></div><div class="uz-text">' + file.name + ' parsed</div>';
        renderATSPanel();
        showModeToggle();
        uploadMode = 'template';
        render();

    } catch(err) {
        console.error('Parse error:', err);
        alert('Failed to parse: ' + err.message);
        resetUploadZone();
    }
}

function resetUploadZone() {
    var zone = document.getElementById('upload-zone');
    if (zone) zone.innerHTML = '<div class="uz-icon"><i class="ph ph-upload-simple"></i></div><div class="uz-text">Drop PDF or DOCX here, or click</div><input type="file" id="upload-input" accept=".pdf,.docx,.doc,.txt">';
    initUploadZone(); // re-bind
}

// ── 12. ATS PANEL RENDERING ─────────────────────────
function renderATSPanel() {
    var panel = document.getElementById('ats-panel');
    if (!panel || !uploadATSResult) return;

    var a = uploadATSResult;
    var g = a.grade.toLowerCase();
    var html = '<div class="ats-score-badge grade-' + g + ' ats-grade-' + g + '">';
    html += '<div class="ats-num">' + a.score + '</div>';
    html += '<div><div class="ats-label">ATS Score</div><div class="ats-label">Grade: ' + a.grade + '</div></div>';
    html += '</div>';

    // Show only fail flags (improvement suggestions)
    var fails = a.flags.filter(function(f) { return f.status === 'fail'; });
    if (fails.length > 0) {
        html += '<div class="ats-flags">';
        fails.forEach(function(f) {
            html += '<div class="ats-flag"><span class="dot fail"></span>' + f.message + '</div>';
        });
        html += '</div>';
    }
    panel.innerHTML = html;
    panel.style.display = '';
}

// ── 13. MODE TOGGLE ─────────────────────────────────
var uploadedRawContent = null;  // raw text/html as extracted
var uploadedIsHTML = false;

function showModeToggle() {
    var el = document.getElementById('mode-toggle');
    if (!el) return;
    el.innerHTML = '<div class="mode-strip"><button class="mode-btn" onclick="setMode(\'original\')">Original</button><button class="mode-btn active" onclick="setMode(\'template\')">Apply Template</button></div>';
    el.style.display = '';
}

function setMode(mode) {
    uploadMode = mode;
    document.querySelectorAll('.mode-btn').forEach(function(b, i) {
        b.classList.toggle('active', (i === 0 && mode === 'original') || (i === 1 && mode === 'template'));
    });

    if (mode === 'original' && uploadedRawContent) {
        var s = state.settings;
        var inner = '';
        if (uploadedIsHTML) {
            inner = uploadedRawContent;
        } else {
            // Plain text: escape HTML entities and wrap in styled pre
            var safe = uploadedRawContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            inner = '<pre style="white-space:pre-wrap;word-wrap:break-word;font-family:var(--r-font);font-size:var(--r-base);line-height:1.6;margin:0;">' + safe + '</pre>';
        }
        document.getElementById('resume-preview').innerHTML =
            '<div class="resume-paper paper-' + s.paper + '" id="r-paper" style="padding:24px 32px;font-family:var(--r-font);font-size:var(--r-base);line-height:1.55;color:var(--r-text);">' + inner + '</div>';
    } else {
        render();
    }
}

// ── 14. BOOT ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function() {
    render();
    setPaper('a4');
    initUploadZone();

    // Check for ?upload=true redirect from upload_resume.html
    var params = new URLSearchParams(window.location.search);
    if (params.get('upload') === 'true' && typeof getUploadedContent === 'function') {
        var uploaded = getUploadedContent();
        if (uploaded) {
            var isHTML = uploaded.format === 'html';
            uploadedRawContent = uploaded.content;
            uploadedIsHTML = isHTML;
            var parsed = parseResumeText(uploaded.content, isHTML);
            if (parsed) {
                Object.assign(state.resume, parsed.resume);
                state.sections.length = 0;
                parsed.sections.forEach(function(s) { state.sections.push(s); });
                uploadATSResult = analyzeATS(parsed.resume);
                renderATSPanel();
                showModeToggle();
                var zone = document.getElementById('upload-zone');
                if (zone) zone.innerHTML = '<div class="uz-icon" style="color:#16a34a;"><i class="ph ph-check-circle"></i></div><div class="uz-text">Uploaded resume loaded</div>';
                render();
            }
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }

    // Auth gate for cloud save section
    if (typeof checkAuthState === 'function') {
        var user = await checkAuthState();
        if (user) {
            document.getElementById('cloud-section').style.display = '';
        }
    }
});
