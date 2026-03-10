/*  ═══════════════════════════════════════════════════════════
    SURPLUS SECURE PLATFORM
    Cloudflare Worker + KV — Admin Dashboard & Content API
    No database. No subscriptions. Just KV + Workers.
    ═══════════════════════════════════════════════════════════ */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── Public API (CORS-enabled for Pages integration) ──
    if (path === '/api/content/public') {
      const data = await env.CONTENT.get('site_content', 'json') || DEFAULTS.content;
      return json(data, corsHeaders(request));
    }

    // ── Auth-free routes ──
    if (path === '/login' && request.method === 'POST') return handleLogin(request, env);
    if (path === '/logout') return handleLogout();

    // ── Protected routes — everything below requires auth ──
    const authed = await checkAuth(request, env);
    if (!authed && path.startsWith('/admin')) return serveLogin(false);
    if (!authed && path.startsWith('/api/')) return json({ error: 'Unauthorized' }, {}, 401);

    // ── API Routes ──
    if (path === '/api/content' && request.method === 'GET') {
      const data = await env.CONTENT.get('site_content', 'json') || DEFAULTS.content;
      return json(data);
    }
    if (path === '/api/content' && request.method === 'PUT') {
      const body = await request.json();
      await env.CONTENT.put('site_content', JSON.stringify(body));
      return json({ ok: true, saved: new Date().toISOString() });
    }
    if (path === '/api/counties' && request.method === 'GET') {
      let data = await env.DATA.get('counties', 'json');
      if (!data) { data = COUNTY_SEED; await env.DATA.put('counties', JSON.stringify(data)); }
      return json(data);
    }
    if (path === '/api/counties' && request.method === 'PUT') {
      const body = await request.json();
      await env.DATA.put('counties', JSON.stringify(body));
      return json({ ok: true, saved: new Date().toISOString() });
    }
    if (path === '/api/county' && request.method === 'PUT') {
      const updated = await request.json();
      let counties = await env.DATA.get('counties', 'json') || COUNTY_SEED;
      const idx = counties.findIndex(c => c.id === updated.id);
      if (idx >= 0) { counties[idx] = { ...counties[idx], ...updated }; }
      await env.DATA.put('counties', JSON.stringify(counties));
      return json({ ok: true });
    }
    if (path === '/api/seed' && request.method === 'POST') {
      await env.DATA.put('counties', JSON.stringify(COUNTY_SEED));
      await env.CONTENT.put('site_content', JSON.stringify(DEFAULTS.content));
      return json({ ok: true, seeded: true });
    }

    // ── Admin Dashboard ──
    if (path.startsWith('/admin') && authed) return serveAdmin();

    // ── Default: redirect to admin ──
    return Response.redirect(url.origin + '/admin', 302);
  }
};

/* ── Auth ── */
async function handleLogin(request, env) {
  const form = await request.formData();
  const pw = form.get('password') || '';
  const APP_PASSWORD = env.APP_PASSWORD || '';
  if (!APP_PASSWORD || pw !== APP_PASSWORD) return serveLogin(true);
  const token = btoa(pw + ':' + Date.now());
  return new Response(null, { status: 302, headers: {
    'Location': '/admin',
    'Set-Cookie': `ss_auth=${token}; Path=/; Max-Age=${60*60*24*30}; HttpOnly; Secure; SameSite=Strict`
  }});
}
function handleLogout() {
  return new Response(null, { status: 302, headers: {
    'Location': '/admin',
    'Set-Cookie': 'ss_auth=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict'
  }});
}
async function checkAuth(request, env) {
  const pw = env.APP_PASSWORD;
  if (!pw) return true;
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/ss_auth=([^;]+)/);
  if (!m) return false;
  try { return atob(m[1]).split(':')[0] === pw; } catch { return false; }
}

/* ── Helpers ── */
function json(data, extra = {}, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...extra }});
}
function corsHeaders(request) {
  return {
    'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/* ── Login Page ── */
function serveLogin(failed) {
  return new Response(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Surplus Secure — Admin</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',system-ui,sans-serif;background:#0f1729;display:flex;align-items:center;justify-content:center;min-height:100vh;color:#c5cdd8}
  .card{background:#1a2540;border:1px solid #2a3a5c;border-radius:16px;padding:2.5rem;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.4)}
  .logo{text-align:center;margin-bottom:2rem}
  .logo-mark{display:inline-flex;width:52px;height:52px;background:#1B2A4A;border:2px solid #C9943E;border-radius:12px;align-items:center;justify-content:center;font-family:'DM Serif Display',Georgia,serif;font-size:22px;font-weight:700;color:#C9943E;margin-bottom:.75rem}
  .logo h2{font-family:'DM Serif Display',Georgia,serif;font-size:1.4rem;color:#e8e4dd}
  .logo h2 span{color:#C9943E}
  label{display:block;font-size:.8rem;font-weight:600;color:#7a8ba8;text-transform:uppercase;letter-spacing:1px;margin-bottom:.5rem}
  input[type=password]{width:100%;padding:.85rem 1rem;background:#0f1729;border:1px solid #2a3a5c;border-radius:10px;color:#e8e4dd;font-size:1rem;font-family:'DM Sans',sans-serif;outline:none;transition:border .2s}
  input:focus{border-color:#C9943E}
  button{width:100%;padding:.85rem;background:#C9943E;color:#1B2A4A;border:none;border-radius:10px;font-size:1rem;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;margin-top:1.25rem;transition:background .2s}
  button:hover{background:#d4a44e}
  .err{background:#3a1a1a;border:1px solid #6b2a2a;color:#f0a0a0;padding:.6rem .8rem;border-radius:8px;font-size:.85rem;margin-bottom:1rem;text-align:center}
</style></head><body>
<div class="card">
  <div class="logo"><div class="logo-mark">SS</div><h2>Surplus <span>Secure</span></h2></div>
  ${failed ? '<div class="err">Incorrect password. Please try again.</div>' : ''}
  <form method="POST" action="/login">
    <label>Password</label>
    <input type="password" name="password" autofocus required>
    <button type="submit">Sign In</button>
  </form>
</div></body></html>`, { headers: { 'Content-Type': 'text/html;charset=UTF-8' }});
}

/* ══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ══════════════════════════════════════════════════════════════ */
function serveAdmin() {
  return new Response(ADMIN_HTML, { headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'no-cache' }});
}

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Surplus Secure — Admin Dashboard</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
:root{
  --navy:#1B2A4A;--gold:#C9943E;--bg:#0f1729;--panel:#1a2540;--panel-hover:#1f2d4a;
  --border:#2a3a5c;--text:#c5cdd8;--text-bright:#e8e4dd;--text-dim:#6b7a96;
  --green:#34d399;--red:#f87171;--amber:#fbbf24;--blue:#60a5fa;
  --radius:12px;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);color:var(--text);display:flex;min-height:100vh}
/* ── Sidebar ── */
.sidebar{width:240px;background:var(--panel);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100}
.sidebar-logo{padding:1.5rem;border-bottom:1px solid var(--border);text-align:center}
.sidebar-logo .mark{display:inline-flex;width:44px;height:44px;background:var(--navy);border:2px solid var(--gold);border-radius:10px;align-items:center;justify-content:center;font-family:'DM Serif Display',serif;font-size:18px;font-weight:700;color:var(--gold);margin-bottom:.5rem}
.sidebar-logo h1{font-family:'DM Serif Display',serif;font-size:1.15rem;color:var(--text-bright)}
.sidebar-logo h1 span{color:var(--gold)}
.sidebar-logo p{font-size:.7rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:1.5px;margin-top:.25rem}
.nav{flex:1;padding:1rem 0}
.nav-item{display:flex;align-items:center;gap:.75rem;padding:.75rem 1.25rem;color:var(--text);text-decoration:none;font-size:.9rem;font-weight:500;cursor:pointer;border-left:3px solid transparent;transition:all .15s}
.nav-item:hover{background:var(--panel-hover);color:var(--text-bright)}
.nav-item.active{background:rgba(201,148,62,.08);color:var(--gold);border-left-color:var(--gold)}
.nav-item svg{width:18px;height:18px;flex-shrink:0}
.sidebar-footer{padding:1rem 1.25rem;border-top:1px solid var(--border)}
.sidebar-footer a{color:var(--text-dim);font-size:.8rem;text-decoration:none}
.sidebar-footer a:hover{color:var(--red)}
/* ── Main ── */
.main{margin-left:240px;flex:1;padding:2rem}
.main-header{margin-bottom:2rem}
.main-header h2{font-family:'DM Serif Display',serif;font-size:1.6rem;color:var(--text-bright)}
.main-header p{color:var(--text-dim);font-size:.85rem;margin-top:.25rem}
/* ── Cards / Panels ── */
.panel{background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;margin-bottom:1.25rem}
.panel h3{font-family:'DM Serif Display',serif;font-size:1.1rem;color:var(--text-bright);margin-bottom:1rem;padding-bottom:.75rem;border-bottom:1px solid var(--border)}
.field{margin-bottom:1.25rem}
.field label{display:block;font-size:.75rem;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:.8px;margin-bottom:.4rem}
.field input,.field textarea,.field select{width:100%;padding:.65rem .85rem;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text-bright);font-size:.9rem;font-family:'DM Sans',sans-serif;outline:none;transition:border .2s;resize:vertical}
.field input:focus,.field textarea:focus,.field select:focus{border-color:var(--gold)}
.field textarea{min-height:70px}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
/* ── Buttons ── */
.btn{padding:.6rem 1.25rem;border:none;border-radius:8px;font-size:.85rem;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:.4rem}
.btn-gold{background:var(--gold);color:var(--navy)}
.btn-gold:hover{background:#d4a44e}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
.btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
.btn-sm{padding:.4rem .85rem;font-size:.8rem}
/* ── Toast ── */
.toast{position:fixed;top:1.5rem;right:1.5rem;background:var(--green);color:#064e3b;padding:.7rem 1.25rem;border-radius:10px;font-size:.85rem;font-weight:600;z-index:999;opacity:0;transform:translateY(-10px);transition:all .3s;pointer-events:none}
.toast.show{opacity:1;transform:translateY(0)}
/* ── County Table ── */
.search-bar{display:flex;gap:.75rem;margin-bottom:1rem;flex-wrap:wrap}
.search-bar input{flex:1;min-width:200px}
.search-bar select{width:auto;min-width:120px}
.county-grid{display:grid;gap:.75rem}
.county-row{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:1rem 1.25rem;display:grid;grid-template-columns:1.8fr 1fr .8fr .8fr 40px;align-items:center;gap:.75rem;transition:border .15s;cursor:pointer}
.county-row:hover{border-color:var(--gold)}
.county-name{font-weight:600;color:var(--text-bright);font-size:.95rem}
.county-treasurer{font-size:.8rem;color:var(--text-dim)}
.county-phone{font-size:.85rem;color:var(--blue)}
.badge{display:inline-block;padding:.2rem .55rem;border-radius:6px;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.badge-green{background:rgba(52,211,153,.12);color:var(--green)}
.badge-amber{background:rgba(251,191,36,.12);color:var(--amber)}
.badge-red{background:rgba(248,113,113,.12);color:var(--red)}
.badge-blue{background:rgba(96,165,250,.12);color:var(--blue)}
.badge-dim{background:rgba(107,122,150,.12);color:var(--text-dim)}
.expand-icon{color:var(--text-dim);transition:transform .2s;text-align:center}
.county-row.open .expand-icon{transform:rotate(180deg)}
.county-detail{display:none;background:var(--bg);border:1px solid var(--border);border-top:none;border-radius:0 0 10px 10px;padding:1.25rem;margin-top:-0.75rem;margin-bottom:.75rem}
.county-detail.open{display:block}
.detail-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem}
.detail-grid .field{margin-bottom:0}
.notes-area{margin-top:1rem}
/* ── Stats Row ── */
.stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem}
.stat-card{background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem;text-align:center}
.stat-card .num{font-family:'DM Serif Display',serif;font-size:2rem;color:var(--gold)}
.stat-card .lbl{font-size:.75rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;margin-top:.25rem}
/* ── Responsive ── */
@media(max-width:900px){
  .sidebar{width:60px;overflow:hidden}
  .sidebar-logo h1,.sidebar-logo p,.nav-item span,.sidebar-footer span{display:none}
  .sidebar-logo{padding:1rem .5rem}
  .nav-item{justify-content:center;padding:.75rem}
  .main{margin-left:60px}
  .county-row{grid-template-columns:1fr;gap:.4rem}
  .detail-grid{grid-template-columns:1fr}
  .field-row{grid-template-columns:1fr}
}
@media(max-width:600px){
  .sidebar{display:none}
  .main{margin-left:0}
  .stats-row{grid-template-columns:1fr 1fr}
}
</style>
</head>
<body>

<!-- Sidebar -->
<aside class="sidebar">
  <div class="sidebar-logo">
    <div class="mark">SS</div>
    <h1>Surplus <span>Secure</span></h1>
    <p>Admin</p>
  </div>
  <nav class="nav">
    <a class="nav-item active" data-view="editor" onclick="switchView('editor')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      <span>Site Editor</span>
    </a>
    <a class="nav-item" data-view="counties" onclick="switchView('counties')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      <span>Counties</span>
    </a>
    <a class="nav-item" data-view="pipeline" onclick="switchView('pipeline')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      <span>Pipeline</span>
    </a>
  </nav>
  <div class="sidebar-footer">
    <a href="/logout"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>Sign Out</span></a>
  </div>
</aside>

<!-- Toast -->
<div class="toast" id="toast">Saved successfully</div>

<!-- Main -->
<div class="main">

  <!-- ═══ SITE EDITOR VIEW ═══ -->
  <div id="view-editor">
    <div class="main-header">
      <h2>Site Editor</h2>
      <p>Edit your landing page content. Changes save to Cloudflare KV and appear on the live site instantly.</p>
    </div>

    <div class="panel">
      <h3>Hero Section</h3>
      <div class="field"><label>Badge Text</label><input id="c-hero_badge" placeholder="e.g. Michigan Surplus Fund Recovery"></div>
      <div class="field"><label>Headline</label><input id="c-hero_headline" placeholder="e.g. Lost Your Home to Tax Foreclosure? You May Be Owed Money."></div>
      <div class="field"><label>Description</label><textarea id="c-hero_description" rows="3"></textarea></div>
      <div class="field-row">
        <div class="field"><label>Primary CTA Text</label><input id="c-hero_cta_primary"></div>
        <div class="field"><label>Text CTA Label</label><input id="c-hero_cta_text"></div>
      </div>
    </div>

    <div class="panel">
      <h3>About Section</h3>
      <div class="field"><label>Section Headline</label><input id="c-about_headline" placeholder="e.g. We're on your side."></div>
    </div>

    <div class="panel">
      <h3>Value Cards</h3>
      <div class="field-row"><div class="field"><label>Card 1 Title</label><input id="c-card1_title"></div><div class="field"><label>Card 1 Description</label><textarea id="c-card1_desc" rows="2"></textarea></div></div>
      <div class="field-row"><div class="field"><label>Card 2 Title</label><input id="c-card2_title"></div><div class="field"><label>Card 2 Description</label><textarea id="c-card2_desc" rows="2"></textarea></div></div>
      <div class="field-row"><div class="field"><label>Card 3 Title</label><input id="c-card3_title"></div><div class="field"><label>Card 3 Description</label><textarea id="c-card3_desc" rows="2"></textarea></div></div>
    </div>

    <div class="panel">
      <h3>Stats Bar</h3>
      <div class="field-row">
        <div class="field"><label>Stat 1 Number</label><input id="c-stat1_number" placeholder="e.g. 1,000+"></div>
        <div class="field"><label>Stat 1 Label</label><input id="c-stat1_label" placeholder="e.g. Foreclosures Reviewed"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Stat 2 Number</label><input id="c-stat2_number"></div>
        <div class="field"><label>Stat 2 Label</label><input id="c-stat2_label"></div>
      </div>
    </div>

    <div class="panel">
      <h3>CTA Banner</h3>
      <div class="field"><label>Headline</label><textarea id="c-cta_headline" rows="2"></textarea></div>
      <div class="field"><label>Subtext</label><input id="c-cta_subtext"></div>
    </div>

    <div class="panel">
      <h3>Testimonials</h3>
      <div class="field-row"><div class="field"><label>Testimonial 1 Quote</label><textarea id="c-test1_quote" rows="2"></textarea></div><div class="field"><label>Author</label><input id="c-test1_author"></div></div>
      <div class="field-row"><div class="field"><label>Testimonial 2 Quote</label><textarea id="c-test2_quote" rows="2"></textarea></div><div class="field"><label>Author</label><input id="c-test2_author"></div></div>
    </div>

    <div class="panel">
      <h3>Contact Information</h3>
      <div class="field-row">
        <div class="field"><label>Phone Number</label><input id="c-phone"></div>
        <div class="field"><label>Email</label><input id="c-email"></div>
      </div>
      <div class="field"><label>Address</label><input id="c-address"></div>
    </div>

    <div style="display:flex;gap:.75rem;margin-top:.5rem">
      <button class="btn btn-gold" onclick="saveContent()">Save All Changes</button>
      <button class="btn btn-ghost" onclick="loadContent()">Reset to Saved</button>
    </div>
  </div>

  <!-- ═══ COUNTIES VIEW ═══ -->
  <div id="view-counties" style="display:none">
    <div class="main-header">
      <h2>County Database</h2>
      <p>83 Michigan counties — manage FOIA status, priority tiers, and operational notes.</p>
    </div>

    <div class="stats-row" id="county-stats"></div>

    <div class="search-bar">
      <input type="text" id="county-search" placeholder="Search counties..." oninput="filterCounties()">
      <select id="filter-region" onchange="filterCounties()">
        <option value="">All Regions</option>
        <option value="UP">Upper Peninsula</option>
        <option value="NW">Northwest</option>
        <option value="NE">Northeast</option>
        <option value="W">West</option>
        <option value="E">East</option>
        <option value="SW">Southwest</option>
        <option value="S">South</option>
        <option value="SE">Southeast</option>
        <option value="N">North</option>
      </select>
      <select id="filter-tier" onchange="filterCounties()">
        <option value="">All Tiers</option>
        <option value="High">High Priority</option>
        <option value="Medium">Medium Priority</option>
        <option value="Low">Low Priority</option>
        <option value="">Unset</option>
      </select>
      <select id="filter-foia" onchange="filterCounties()">
        <option value="">All FOIA Status</option>
        <option value="Not Started">Not Started</option>
        <option value="Submitted">Submitted</option>
        <option value="Received">Received</option>
        <option value="Denied">Denied</option>
      </select>
    </div>

    <div class="county-grid" id="county-grid"></div>
    <div style="margin-top:1rem;display:flex;gap:.75rem">
      <button class="btn btn-gold" onclick="saveCounties()">Save All County Data</button>
    </div>
  </div>

  <!-- ═══ PIPELINE VIEW ═══ -->
  <div id="view-pipeline" style="display:none">
    <div class="main-header">
      <h2>Recovery Pipeline</h2>
      <p>Track active surplus recovery cases by stage.</p>
    </div>
    <div id="pipeline-board" class="stats-row"></div>
    <div id="pipeline-detail"></div>
  </div>

</div>

<script>
/* ── State ── */
let content = {};
let counties = [];
let currentView = 'editor';

/* ── View Switching ── */
function switchView(view) {
  document.querySelectorAll('[id^="view-"]').forEach(v => v.style.display = 'none');
  document.getElementById('view-' + view).style.display = 'block';
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector('[data-view="' + view + '"]').classList.add('active');
  currentView = view;
  if (view === 'counties') renderCounties();
  if (view === 'pipeline') renderPipeline();
}

/* ── Toast ── */
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

/* ══════════ CONTENT EDITOR ══════════ */
async function loadContent() {
  try {
    const res = await fetch('/api/content');
    content = await res.json();
  } catch { content = {}; }
  // Populate fields
  document.querySelectorAll('[id^="c-"]').forEach(el => {
    const key = el.id.replace('c-','');
    if (content[key] !== undefined) el.value = content[key];
  });
}

async function saveContent() {
  document.querySelectorAll('[id^="c-"]').forEach(el => {
    content[el.id.replace('c-','')] = el.value;
  });
  try {
    const res = await fetch('/api/content', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(content) });
    const data = await res.json();
    if (data.ok) toast('Content saved — changes are live!');
  } catch(e) { toast('Error saving content'); }
}

/* ══════════ COUNTY DATABASE ══════════ */
async function loadCounties() {
  try {
    const res = await fetch('/api/counties');
    counties = await res.json();
  } catch { counties = []; }
}

function renderCountyStats() {
  const total = counties.length;
  const high = counties.filter(c => c.tier === 'High').length;
  const foiaSubmitted = counties.filter(c => c.foiaStatus === 'Submitted' || c.foiaStatus === 'Received').length;
  const inPipeline = counties.filter(c => c.pipelineStage && c.pipelineStage !== 'None').length;
  const withData = counties.filter(c => c.parcels);
  const totalRetained = withData.reduce((s, c) => s + (c.netSurplusRetained||0), 0);
  const totalClaimed = withData.reduce((s, c) => s + (c.surplusClaimed||0), 0);
  document.getElementById('county-stats').innerHTML =
    '<div class="stat-card"><div class="num">' + total + '</div><div class="lbl">Total Counties</div></div>' +
    '<div class="stat-card"><div class="num">' + high + '</div><div class="lbl">High Priority</div></div>' +
    '<div class="stat-card"><div class="num">' + foiaSubmitted + '</div><div class="lbl">FOIA Active</div></div>' +
    '<div class="stat-card"><div class="num">' + inPipeline + '</div><div class="lbl">In Pipeline</div></div>' +
    (withData.length > 0 ? '<div class="stat-card"><div class="num" style="color:var(--red)">$' + Math.round(totalRetained).toLocaleString() + '</div><div class="lbl">Surplus Retained (' + withData.length + ' counties)</div></div>' +
    '<div class="stat-card"><div class="num" style="color:var(--green)">$' + Math.round(totalClaimed).toLocaleString() + '</div><div class="lbl">Surplus Claimed</div></div>' : '');
}

function renderCounties() {
  renderCountyStats();
  filterCounties();
}

function filterCounties() {
  const q = (document.getElementById('county-search').value || '').toLowerCase();
  const region = document.getElementById('filter-region').value;
  const tier = document.getElementById('filter-tier').value;
  const foia = document.getElementById('filter-foia').value;
  const filtered = counties.filter(c => {
    if (q && !c.name.toLowerCase().includes(q) && !(c.treasurer||'').toLowerCase().includes(q)) return false;
    if (region && c.region !== region) return false;
    if (tier && (c.tier || '') !== tier) return false;
    if (foia && (c.foiaStatus || 'Not Started') !== foia) return false;
    return true;
  });
  const grid = document.getElementById('county-grid');
  grid.innerHTML = filtered.map((c, i) => {
    const tierBadge = c.tier === 'High' ? 'badge-green' : c.tier === 'Medium' ? 'badge-amber' : c.tier === 'Low' ? 'badge-blue' : 'badge-dim';
    const foiaBadge = c.foiaStatus === 'Received' ? 'badge-green' : c.foiaStatus === 'Submitted' ? 'badge-amber' : c.foiaStatus === 'Denied' ? 'badge-red' : 'badge-dim';
    return '<div class="county-row" onclick="toggleCounty(this,\\'' + c.id + '\\')" data-id="' + c.id + '">' +
      '<div><div class="county-name">' + c.name + ' County</div><div class="county-treasurer">' + (c.treasurer||'—') + '</div></div>' +
      '<div class="county-phone">' + (c.phone||'—') + '</div>' +
      '<div><span class="badge ' + tierBadge + '">' + (c.tier||'Unset') + '</span></div>' +
      '<div><span class="badge ' + foiaBadge + '">' + (c.foiaStatus||'Not Started') + '</span></div>' +
      '<div class="expand-icon">▾</div>' +
    '</div>' +
    '<div class="county-detail" id="detail-' + c.id + '">' +
      '<div class="detail-grid">' +
        '<div class="field"><label>Priority Tier</label><select onchange="updateCounty(\\'' + c.id + '\\',\\'tier\\',this.value)">' +
          '<option' + (!c.tier ? ' selected' : '') + ' value="">Unset</option>' +
          '<option' + (c.tier==='High' ? ' selected' : '') + '>High</option>' +
          '<option' + (c.tier==='Medium' ? ' selected' : '') + '>Medium</option>' +
          '<option' + (c.tier==='Low' ? ' selected' : '') + '>Low</option></select></div>' +
        '<div class="field"><label>FOIA Status</label><select onchange="updateCounty(\\'' + c.id + '\\',\\'foiaStatus\\',this.value)">' +
          '<option' + ((!c.foiaStatus||c.foiaStatus==='Not Started') ? ' selected' : '') + '>Not Started</option>' +
          '<option' + (c.foiaStatus==='Submitted' ? ' selected' : '') + '>Submitted</option>' +
          '<option' + (c.foiaStatus==='Received' ? ' selected' : '') + '>Received</option>' +
          '<option' + (c.foiaStatus==='Denied' ? ' selected' : '') + '>Denied</option></select></div>' +
        '<div class="field"><label>Pipeline Stage</label><select onchange="updateCounty(\\'' + c.id + '\\',\\'pipelineStage\\',this.value)">' +
          '<option' + ((!c.pipelineStage||c.pipelineStage==='None') ? ' selected' : '') + ' value="None">None</option>' +
          '<option' + (c.pipelineStage==='Research' ? ' selected' : '') + '>Research</option>' +
          '<option' + (c.pipelineStage==='FOIA Pending' ? ' selected' : '') + '>FOIA Pending</option>' +
          '<option' + (c.pipelineStage==='Data Received' ? ' selected' : '') + '>Data Received</option>' +
          '<option' + (c.pipelineStage==='Outreach' ? ' selected' : '') + '>Outreach</option>' +
          '<option' + (c.pipelineStage==='Active Case' ? ' selected' : '') + '>Active Case</option>' +
          '<option' + (c.pipelineStage==='Filed' ? ' selected' : '') + '>Filed</option>' +
          '<option' + (c.pipelineStage==='Recovered' ? ' selected' : '') + '>Recovered</option></select></div>' +
      '</div>' +
      '<div class="detail-grid" style="margin-top:.75rem">' +
        '<div class="field"><label>FOIA Method</label><input value="' + (c.foiaMethod||'') + '" onchange="updateCounty(\\'' + c.id + '\\',\\'foiaMethod\\',this.value)" placeholder="Email, portal, mail..."></div>' +
        '<div class="field"><label>FGU Status</label><div style="padding:.65rem 0;color:var(--text-bright)">' + c.fgu + (c.fguNote ? ' — ' + c.fguNote : '') + '</div></div>' +
        '<div class="field"><label>Address</label><div style="padding:.65rem 0;font-size:.85rem;color:var(--text)">' + (c.address||'—') + '</div></div>' +
      '</div>' +
      '<div class="notes-area"><div class="field"><label>Notes</label><textarea rows="2" onchange="updateCounty(\\'' + c.id + '\\',\\'notes\\',this.value)" placeholder="Add operational notes...">' + (c.notes||'') + '</textarea></div></div>' +
      (c.parcels ? '<div style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--border)"><div style="font-size:.75rem;font-weight:600;color:var(--gold);text-transform:uppercase;letter-spacing:.8px;margin-bottom:.5rem">2023 Foreclosure Sale Data</div><div class="detail-grid" style="grid-template-columns:repeat(5,1fr)">' +
        '<div class="field"><label># Parcels</label><div style="padding:.4rem 0;color:var(--text-bright);font-weight:600">' + c.parcels + '</div></div>' +
        '<div class="field"><label>Total Due County</label><div style="padding:.4rem 0;color:var(--text-bright)">$' + (c.totalDueCounty||0).toLocaleString() + '</div></div>' +
        '<div class="field"><label>Paid at Auction</label><div style="padding:.4rem 0;color:var(--text-bright)">$' + (c.totalPaidAtAuction||0).toLocaleString() + '</div></div>' +
        '<div class="field"><label>Surplus Claimed</label><div style="padding:.4rem 0;color:var(--green)">$' + (c.surplusClaimed||0).toLocaleString() + '</div></div>' +
        '<div class="field"><label>Net Retained by County</label><div style="padding:.4rem 0;color:var(--red)">$' + (c.netSurplusRetained||0).toLocaleString() + '</div></div>' +
      '</div></div>' : '') +
    '</div>';
  }).join('');
}

function toggleCounty(row, id) {
  const detail = document.getElementById('detail-' + id);
  const isOpen = detail.classList.contains('open');
  // Close all
  document.querySelectorAll('.county-detail.open').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.county-row.open').forEach(r => r.classList.remove('open'));
  if (!isOpen) { detail.classList.add('open'); row.classList.add('open'); }
}

function updateCounty(id, field, value) {
  const c = counties.find(x => x.id === id);
  if (c) c[field] = value;
  renderCountyStats();
}

async function saveCounties() {
  try {
    const res = await fetch('/api/counties', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(counties) });
    const data = await res.json();
    if (data.ok) toast('County data saved to KV!');
  } catch(e) { toast('Error saving county data'); }
}

/* ══════════ PIPELINE VIEW ══════════ */
function renderPipeline() {
  const stages = ['Research','FOIA Pending','Data Received','Outreach','Active Case','Filed','Recovered'];
  const stageColors = {Research:'blue',['FOIA Pending']:'amber',['Data Received']:'green',Outreach:'gold',['Active Case']:'amber',Filed:'blue',Recovered:'green'};
  const board = document.getElementById('pipeline-board');
  board.innerHTML = stages.map(s => {
    const inStage = counties.filter(c => c.pipelineStage === s);
    return '<div class="stat-card"><div class="num">' + inStage.length + '</div><div class="lbl">' + s + '</div></div>';
  }).join('');

  const active = counties.filter(c => c.pipelineStage && c.pipelineStage !== 'None');
  document.getElementById('pipeline-detail').innerHTML = active.length === 0
    ? '<div class="panel" style="text-align:center;color:var(--text-dim);padding:3rem">No counties in the pipeline yet. Set pipeline stages in the Counties tab.</div>'
    : '<div class="panel"><h3>Active Pipeline (' + active.length + ' counties)</h3>' +
      active.map(c => '<div style="display:flex;align-items:center;justify-content:space-between;padding:.6rem 0;border-bottom:1px solid var(--border)">' +
        '<div><span style="font-weight:600;color:var(--text-bright)">' + c.name + '</span> <span class="badge badge-' + (stageColors[c.pipelineStage]||'dim') + '">' + c.pipelineStage + '</span></div>' +
        '<span style="font-size:.8rem;color:var(--text-dim)">' + (c.tier||'Unset') + ' priority</span></div>'
      ).join('') + '</div>';
}

/* ══════════ INIT ══════════ */
async function init() {
  await Promise.all([loadContent(), loadCounties()]);
  renderCounties();
}
init();
</script>
</body></html>`;


/* ══════════════════════════════════════════════════════════════
   DEFAULT CONTENT — matches the AEO-optimized landing page
   ══════════════════════════════════════════════════════════════ */
const DEFAULTS = {
  content: {
    hero_badge: "Michigan Surplus Fund Recovery",
    hero_headline: "Lost Your Home to Tax Foreclosure? You May Be Owed Money.",
    about_headline: "We're on your side.",
    hero_description: "After a tax foreclosure sale, the county keeps only what was owed in taxes and a small fee. Any money left over — called \"surplus\" — belongs to you by law. We make the recovery process simple so you can get what's yours.",
    hero_cta_primary: "Call Now — Free Info Session",
    hero_cta_text: "Text Us Instead",
    card1_title: "This Money Is Yours",
    card1_desc: "The law is clear — any extra money from the sale of your property belongs to you. We're here to make sure that's respected.",
    card2_title: "We Walk With You",
    card2_desc: "The paperwork, the court filings, the deadlines — you don't have to figure any of that out alone. We handle it all so you can focus on what matters.",
    card3_title: "No Cost Unless You're Paid",
    card3_desc: "You pay nothing upfront. We only receive a fee when we successfully recover your money. That's our promise to you.",
    stat1_number: "1,000+",
    stat1_label: "Foreclosures Reviewed",
    stat2_number: "100%",
    stat2_label: "Funds Recovered",
    cta_headline: "This isn't the end of your story.\nLet's write the next chapter.",
    cta_subtext: "Call or text today for a free information session. No cost. No pressure. No risk.",
    test1_quote: "Kelli was my guardian angel. She helped me understand the process, protected my equity, and kept me informed every step of the way.",
    test1_author: "Dennis A.",
    test2_quote: "Kelli is an extraordinary lawyer. Her tenacious drive for justice helped me secure a significant amount of money after a long foreclosure nightmare.",
    test2_author: "Janice S.",
    phone: "(734) 215-5540",
    email: "surplussecure@gmail.com",
    address: "455 E Eisenhower Pkwy, Ste. 300, Ann Arbor, MI 48108",
  }
};


/* ══════════════════════════════════════════════════════════════
   COUNTY SEED DATA — 83 Michigan counties
   ══════════════════════════════════════════════════════════════ */
const COUNTY_SEED = [
  {id:"alcona",name:"Alcona",fips:"26001",treasurer:"Cheryl L. Franks",phone:"989-724-9420",address:"106 5th Street, P.O. Box 158, Harrisville, MI 48740",fgu:"County",fguNote:"",region:"NE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"alger",name:"Alger",fips:"26003",treasurer:"Pamela Johnson",phone:"906-387-4535",address:"101 Court Street, Munising, MI 49862",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"allegan",name:"Allegan",fips:"26005",treasurer:"Sally L. Brooks",phone:"269-673-0260",address:"3283 122nd Ave, Allegan, MI 49010",fgu:"County",fguNote:"",region:"SW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"alpena",name:"Alpena",fips:"26007",treasurer:"Cindy Cebula",phone:"989-354-9534",address:"720 W. Chicholm St., Suite 3, Alpena, MI 49707",fgu:"County",fguNote:"",region:"NE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"antrim",name:"Antrim",fips:"26009",treasurer:"Sherry A. Comben",phone:"231-533-6720",address:"203 E. Cayuga St., Bellaire, MI 49615",fgu:"County",fguNote:"",region:"NW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"arenac",name:"Arenac",fips:"26011",treasurer:"Julie A. Hazeltine",phone:"989-846-4106",address:"120 N. Grove St., P.O. Box 747, Standish, MI 48658",fgu:"County",fguNote:"",region:"NE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"baraga",name:"Baraga",fips:"26013",treasurer:"Jill C. Tollefson",phone:"906-524-7773",address:"16 N. 3rd St., L'Anse, MI 49946",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"barry",name:"Barry",fips:"26015",treasurer:"Kelli Shumway",phone:"269-945-1287",address:"220 W. State St., Hastings, MI 49058",fgu:"County",fguNote:"",region:"SW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"bay",name:"Bay",fips:"26017",treasurer:"Weston Prince",phone:"989-895-4285",address:"515 Center Ave., Bay City, MI 48708",fgu:"County",fguNote:"",region:"E",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"benzie",name:"Benzie",fips:"26019",treasurer:"Kelly Long",phone:"231-882-0011",address:"448 Court Pl., Beulah, MI 49617",fgu:"County",fguNote:"",region:"NW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"berrien",name:"Berrien",fips:"26021",treasurer:"Shelly Weich",phone:"269-982-8645",address:"811 Port St., St. Joseph, MI 49085",fgu:"County",fguNote:"",region:"SW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"branch",name:"Branch",fips:"26023",treasurer:"MI Dept of Treasury",phone:"517-335-7487",address:"Lansing, MI",fgu:"State",fguNote:"State-administered FGU",region:"S",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"calhoun",name:"Calhoun",fips:"26025",treasurer:"Brian W. Wensauer",phone:"269-781-0807",address:"315 W. Green St., Marshall, MI 49068",fgu:"County",fguNote:"",region:"S",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"cass",name:"Cass",fips:"26027",treasurer:"Hope Anderson",phone:"269-445-4468",address:"120 N. Broadway, Cassopolis, MI 49031",fgu:"County",fguNote:"",region:"SW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"charlevoix",name:"Charlevoix",fips:"26029",treasurer:"Julie Wheat",phone:"231-547-7202",address:"203 Antrim St., Charlevoix, MI 49720",fgu:"County",fguNote:"",region:"NW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"cheboygan",name:"Cheboygan",fips:"26031",treasurer:"Buffy Jo Weldon",phone:"231-627-8821",address:"870 S. Main St., Cheboygan, MI 49721",fgu:"County",fguNote:"",region:"N",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"chippewa",name:"Chippewa",fips:"26033",treasurer:"Carmen Fazzari",phone:"906-635-6308",address:"319 Court St., Sault Ste. Marie, MI 49783",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"clare",name:"Clare",fips:"26035",treasurer:"Jenny Thomas",phone:"989-539-7131",address:"225 W. Main St., Harrison, MI 48625",fgu:"County",fguNote:"",region:"N",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"clinton",name:"Clinton",fips:"26037",treasurer:"Mary Beth Bates",phone:"989-224-5120",address:"100 E. State St., Suite 1300, St. Johns, MI 48879",fgu:"County",fguNote:"",region:"S",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"crawford",name:"Crawford",fips:"26039",treasurer:"Gari Lee Gird",phone:"989-344-3224",address:"200 W. Michigan Ave., Grayling, MI 49738",fgu:"County",fguNote:"",region:"N",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"delta",name:"Delta",fips:"26041",treasurer:"Nancy Kolich",phone:"906-789-5118",address:"310 Ludington St., Escanaba, MI 49829",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"dickinson",name:"Dickinson",fips:"26043",treasurer:"Dawn Nelson",phone:"906-774-2572",address:"705 S. Stephenson Ave., Iron Mountain, MI 49801",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"eaton",name:"Eaton",fips:"26045",treasurer:"Robert Hanvey",phone:"517-543-7500 x301",address:"1045 Independence Blvd., Charlotte, MI 48813",fgu:"County",fguNote:"",region:"S",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"emmet",name:"Emmet",fips:"26047",treasurer:"Carol Ellison",phone:"231-348-1740",address:"200 Division St., Petoskey, MI 49770",fgu:"County",fguNote:"",region:"NW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"genesee",name:"Genesee",fips:"26049",treasurer:"Sheldon Neeley (City Treas.)",phone:"810-766-7346",address:"1101 Beach St., Flint, MI 48502",fgu:"County",fguNote:"High volume county",region:"E",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"gladwin",name:"Gladwin",fips:"26051",treasurer:"Rebecca Bobb",phone:"989-426-7351",address:"401 W. Cedar Ave., Gladwin, MI 48624",fgu:"County",fguNote:"",region:"NE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"gogebic",name:"Gogebic",fips:"26053",treasurer:"Lorri Woodard",phone:"906-667-0382",address:"200 N. Moore St., Bessemer, MI 49911",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"grand_traverse",name:"Grand Traverse",fips:"26055",treasurer:"Heidi Schimke",phone:"231-922-4750",address:"400 Boardman Ave., Traverse City, MI 49684",fgu:"County",fguNote:"",region:"NW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"gratiot",name:"Gratiot",fips:"26057",treasurer:"Missy Moeggenborg",phone:"989-875-5215",address:"214 E. Center St., Ithaca, MI 48847",fgu:"County",fguNote:"",region:"E",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"hillsdale",name:"Hillsdale",fips:"26059",treasurer:"Shannon Lee Kast",phone:"517-437-3391",address:"29 N. Howell St., Hillsdale, MI 49242",fgu:"County",fguNote:"",region:"S",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"houghton",name:"Houghton",fips:"26061",treasurer:"Lisa Mattila",phone:"906-482-1150",address:"401 E. Houghton Ave., Houghton, MI 49931",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"huron",name:"Huron",fips:"26063",treasurer:"Mary Ellen McKimmy",phone:"989-269-9944",address:"250 E. Huron Ave., Bad Axe, MI 48413",fgu:"County",fguNote:"",region:"E",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"ingham",name:"Ingham",fips:"26065",treasurer:"Alan Fox",phone:"517-676-7220",address:"341 S. Jefferson St., Mason, MI 48854",fgu:"County",fguNote:"",region:"S",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"ionia",name:"Ionia",fips:"26067",treasurer:"Patricia Roush",phone:"616-527-5322",address:"100 Library St., Ionia, MI 48846",fgu:"County",fguNote:"",region:"W",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"iosco",name:"Iosco",fips:"26069",treasurer:"Mary Lewandowski",phone:"989-362-3497",address:"422 Lake St., Tawas City, MI 48764",fgu:"County",fguNote:"",region:"NE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"iron",name:"Iron",fips:"26071",treasurer:"Melanie Camps",phone:"906-875-3322",address:"2 S. 6th St., Crystal Falls, MI 49920",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"isabella",name:"Isabella",fips:"26073",treasurer:"Steven Pickens",phone:"989-772-0911 x352",address:"200 N. Main St., Mt. Pleasant, MI 48858",fgu:"County",fguNote:"Pung v. Isabella County — SCOTUS pending",region:"E",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"jackson",name:"Jackson",fips:"26075",treasurer:"Karen Coffman",phone:"517-788-4426",address:"120 W. Michigan Ave., Jackson, MI 49201",fgu:"County",fguNote:"",region:"S",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"kalamazoo",name:"Kalamazoo",fips:"26077",treasurer:"Mary Balkema",phone:"269-384-8124",address:"201 W. Kalamazoo Ave., Kalamazoo, MI 49007",fgu:"County",fguNote:"",region:"SW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"kalkaska",name:"Kalkaska",fips:"26079",treasurer:"Christal Klingbeil",phone:"231-258-3310",address:"605 N. Birch St., Kalkaska, MI 49646",fgu:"County",fguNote:"",region:"NW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"kent",name:"Kent",fips:"26081",treasurer:"Peter F. MacGregor",phone:"616-632-7490",address:"300 Monroe Ave. NW, Grand Rapids, MI 49503",fgu:"County",fguNote:"High volume county",region:"W",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:"",foreclosureYear:"2023",parcels:13,totalDueCounty:96421.18,totalPaidAtAuction:556201.73,surplusClaimed:186287.98,netSurplusRetained:274074.88},
  {id:"keweenaw",name:"Keweenaw",fips:"26083",treasurer:"Julie A. Jokinen",phone:"906-337-2229",address:"5095 4th St., Eagle River, MI 49950",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"lake",name:"Lake",fips:"26085",treasurer:"Judy Nichols",phone:"231-745-4614",address:"800 10th St., Suite 200, Baldwin, MI 49304",fgu:"County",fguNote:"",region:"W",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"lapeer",name:"Lapeer",fips:"26087",treasurer:"Dana M. Miller",phone:"810-667-0229",address:"255 Clay St., Lapeer, MI 48446",fgu:"County",fguNote:"",region:"E",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"leelanau",name:"Leelanau",fips:"26089",treasurer:"John A. Gallagher",phone:"231-256-9832",address:"8527 E. Government Center Dr., Suttons Bay, MI 49682",fgu:"County",fguNote:"",region:"NW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"lenawee",name:"Lenawee",fips:"26091",treasurer:"Marilyn J. Woods",phone:"517-264-4542",address:"301 N. Main St., Adrian, MI 49221",fgu:"County",fguNote:"",region:"SE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"livingston",name:"Livingston",fips:"26093",treasurer:"Jennifer Gehringer",phone:"517-546-7010",address:"200 E. Grand River Ave., Howell, MI 48843",fgu:"County",fguNote:"",region:"SE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"luce",name:"Luce",fips:"26095",treasurer:"Shannon Price",phone:"906-293-5521",address:"407 W. Harrie St., Newberry, MI 49868",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"mackinac",name:"Mackinac",fips:"26097",treasurer:"Karen Cheeseman",phone:"906-643-7300",address:"100 Marley St., St. Ignace, MI 49781",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"macomb",name:"Macomb",fips:"26099",treasurer:"Lawrence Rocca",phone:"586-469-5190",address:"1 S. Main St., Mount Clemens, MI 48043",fgu:"County",fguNote:"High volume county",region:"SE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"manistee",name:"Manistee",fips:"26101",treasurer:"Dana Johnson",phone:"231-723-3261",address:"415 Third St., Manistee, MI 49660",fgu:"County",fguNote:"",region:"NW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"marquette",name:"Marquette",fips:"26103",treasurer:"Lyn Delhagen",phone:"906-225-8465",address:"234 W. Baraga Ave., Marquette, MI 49855",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"mason",name:"Mason",fips:"26105",treasurer:"Andrew G. Kmetz",phone:"231-843-1975",address:"304 E. Ludington Ave., Ludington, MI 49431",fgu:"County",fguNote:"",region:"W",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"mecosta",name:"Mecosta",fips:"26107",treasurer:"Michelle Braman",phone:"231-592-0107",address:"400 Elm St., Big Rapids, MI 49307",fgu:"County",fguNote:"",region:"W",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"menominee",name:"Menominee",fips:"26109",treasurer:"Linda Brandt",phone:"906-863-2634",address:"839 10th Ave., Menominee, MI 49858",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"midland",name:"Midland",fips:"26111",treasurer:"Cathy Lunsford",phone:"989-832-6878",address:"220 W. Ellsworth St., Midland, MI 48640",fgu:"County",fguNote:"",region:"E",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"missaukee",name:"Missaukee",fips:"26113",treasurer:"Lori Cox",phone:"231-839-4967",address:"111 S. Canal St., Lake City, MI 49651",fgu:"County",fguNote:"",region:"NW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"monroe",name:"Monroe",fips:"26115",treasurer:"Kay Sisung",phone:"734-240-7370",address:"51 S. Macomb St., Monroe, MI 48161",fgu:"County",fguNote:"",region:"SE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"montcalm",name:"Montcalm",fips:"26117",treasurer:"Nicki Myers",phone:"989-831-7322",address:"211 W. Main St., Stanton, MI 48888",fgu:"County",fguNote:"",region:"W",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"montmorency",name:"Montmorency",fips:"26119",treasurer:"Cindy Kline",phone:"989-785-8084",address:"12265 M-32 W., Atlanta, MI 49709",fgu:"County",fguNote:"",region:"NE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"muskegon",name:"Muskegon",fips:"26121",treasurer:"Tony Moulatsiotis",phone:"231-724-6271",address:"990 Terrace St., Muskegon, MI 49442",fgu:"County",fguNote:"",region:"W",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"newaygo",name:"Newaygo",fips:"26123",treasurer:"Tamyra Kooi",phone:"231-689-7222",address:"1087 Newell St., White Cloud, MI 49349",fgu:"County",fguNote:"",region:"W",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"oakland",name:"Oakland",fips:"26125",treasurer:"Robert Wittenberg",phone:"248-858-0611",address:"1200 N. Telegraph Rd., Pontiac, MI 48341",fgu:"County",fguNote:"Highest volume county",region:"SE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"oceana",name:"Oceana",fips:"26127",treasurer:"Michelle VanDam",phone:"231-873-4835",address:"100 State St., Hart, MI 49420",fgu:"County",fguNote:"",region:"W",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"ogemaw",name:"Ogemaw",fips:"26129",treasurer:"Caren Piglowski",phone:"989-345-0215 x268",address:"806 W. Houghton Ave., West Branch, MI 48661",fgu:"County",fguNote:"",region:"NE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"ontonagon",name:"Ontonagon",fips:"26131",treasurer:"Jean Rondeau",phone:"906-884-4255",address:"725 Greenland Rd., Ontonagon, MI 49953",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"osceola",name:"Osceola",fips:"26133",treasurer:"Terri Lathrop",phone:"231-832-6144",address:"301 W. Upton Ave., Reed City, MI 49677",fgu:"County",fguNote:"",region:"W",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"oscoda",name:"Oscoda",fips:"26135",treasurer:"Robert Sobeck",phone:"989-826-1120",address:"311 Morenci Ave., Mio, MI 48647",fgu:"County",fguNote:"",region:"NE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"otsego",name:"Otsego",fips:"26137",treasurer:"Janet Reames",phone:"989-731-0210",address:"225 W. Main St., Gaylord, MI 49735",fgu:"County",fguNote:"",region:"N",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"ottawa",name:"Ottawa",fips:"26139",treasurer:"Bradley Slagh",phone:"616-994-4510",address:"12220 Fillmore St., West Olive, MI 49460",fgu:"County",fguNote:"",region:"W",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"presque_isle",name:"Presque Isle",fips:"26141",treasurer:"Bridgette Sholes",phone:"989-734-3288",address:"151 E. Huron Ave., Rogers City, MI 49779",fgu:"County",fguNote:"",region:"NE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"roscommon",name:"Roscommon",fips:"26143",treasurer:"LeeAnn Ridley",phone:"989-275-5232",address:"500 Lake St., Roscommon, MI 48653",fgu:"County",fguNote:"",region:"N",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"saginaw",name:"Saginaw",fips:"26145",treasurer:"Deana Harris",phone:"989-790-5240",address:"111 S. Michigan Ave., Saginaw, MI 48602",fgu:"County",fguNote:"High volume county",region:"E",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"sanilac",name:"Sanilac",fips:"26147",treasurer:"Shelly Smigielski",phone:"810-648-2122",address:"60 W. Sanilac Ave., Sandusky, MI 48471",fgu:"County",fguNote:"",region:"E",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"schoolcraft",name:"Schoolcraft",fips:"26149",treasurer:"Jamie Stille",phone:"906-341-3618",address:"300 Walnut St., Manistique, MI 49854",fgu:"County",fguNote:"",region:"UP",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"shiawassee",name:"Shiawassee",fips:"26151",treasurer:"Julie L. Huthoefer",phone:"989-743-2244",address:"208 N. Shiawassee St., Corunna, MI 48817",fgu:"County",fguNote:"",region:"E",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"st_clair",name:"St. Clair",fips:"26153",treasurer:"Kelly Roberts",phone:"810-989-6935",address:"201 McMorran Blvd., Port Huron, MI 48060",fgu:"County",fguNote:"",region:"SE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"st_joseph",name:"St. Joseph",fips:"26155",treasurer:"Kathy Humphreys",phone:"269-467-5511",address:"125 W. Main St., Centreville, MI 49032",fgu:"County",fguNote:"",region:"SW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"tuscola",name:"Tuscola",fips:"26157",treasurer:"Ashley Bennett",phone:"989-672-3870",address:"440 N. State St., Caro, MI 48723",fgu:"County",fguNote:"",region:"E",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"van_buren",name:"Van Buren",fips:"26159",treasurer:"Tammy Budd",phone:"269-657-8241",address:"212 E. Paw Paw St., Paw Paw, MI 49079",fgu:"County",fguNote:"",region:"SW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"washtenaw",name:"Washtenaw",fips:"26161",treasurer:"Catherine McClary",phone:"734-222-6600",address:"200 N. Main St., Ann Arbor, MI 48104",fgu:"County",fguNote:"Home county",region:"SE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"wayne",name:"Wayne",fips:"26163",treasurer:"Eric Sabree",phone:"313-224-5990",address:"400 Monroe St., Detroit, MI 48226",fgu:"County",fguNote:"Highest foreclosure volume in state",region:"SE",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
  {id:"wexford",name:"Wexford",fips:"26165",treasurer:"Brenda Jankovic",phone:"231-779-9475",address:"437 E. Division St., Cadillac, MI 49601",fgu:"County",fguNote:"",region:"NW",tier:"",foiaStatus:"",foiaMethod:"",pipelineStage:"None",notes:""},
];
