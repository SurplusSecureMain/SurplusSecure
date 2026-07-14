/*  ═══════════════════════════════════════════════════════════
    IRISFLOW — open-source work OS on the EIM stack
    Cloudflare Worker + KV. No database. No subscriptions. $0.
    MIT License — see LICENSE in this directory.
    ═══════════════════════════════════════════════════════════ */

import APP_HTML from './app.html';

const DOC_KEY = 'irisflow:doc';
const COOKIE = 'if_session';
const SESSION_DAYS = 30;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // The app is a private surface: keep every crawler out (site-kit path protection).
    if (path === '/robots.txt') {
      return withSecurity(new Response('User-agent: *\nDisallow: /\n', {
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
      }));
    }
    if (path === '/health') return withSecurity(json({ ok: true }));

    if (path === '/login' && request.method === 'POST') return withSecurity(await handleLogin(request, env));
    if (path === '/logout') return withSecurity(handleLogout());

    const authed = await checkAuth(request, env);

    if (path === '/api/data') {
      if (!authed) return withSecurity(json({ error: 'Unauthorized' }, 401));
      if (request.method === 'GET') {
        const stored = await env.DATA.get(DOC_KEY, 'json');
        return withSecurity(json(stored || { rev: 0, doc: null }));
      }
      if (request.method === 'PUT') {
        let body;
        try { body = await request.json(); } catch { return withSecurity(json({ error: 'Bad JSON' }, 400)); }
        if (typeof body?.rev !== 'number' || body.doc === undefined) {
          return withSecurity(json({ error: 'Expected { rev, doc }' }, 400));
        }
        const stored = await env.DATA.get(DOC_KEY, 'json');
        const currentRev = stored ? stored.rev : 0;
        if (body.rev !== currentRev) {
          // Someone else saved first — hand back their version instead of clobbering it.
          return withSecurity(json({ error: 'Conflict', rev: currentRev, doc: stored ? stored.doc : null }, 409));
        }
        const next = { rev: currentRev + 1, doc: body.doc, savedAt: new Date().toISOString() };
        await env.DATA.put(DOC_KEY, JSON.stringify(next));
        return withSecurity(json({ ok: true, rev: next.rev, savedAt: next.savedAt }));
      }
      return withSecurity(json({ error: 'Method not allowed' }, 405));
    }

    if (path === '/' || path === '/index.html') {
      if (!authed) return withSecurity(serveLogin(false));
      return withSecurity(html(APP_HTML));
    }

    return withSecurity(json({ error: 'Not found' }, 404));
  }
};

/* ── Auth ─────────────────────────────────────────────────────
   Sessions are HMAC-signed expiry stamps keyed off APP_PASSWORD.
   The cookie never contains the password (reversible tokens leak
   the credential to anything that can read a cookie). */

async function hmacHex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function makeSession(env) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  const sig = await hmacHex(env.APP_PASSWORD, 'irisflow:' + exp);
  return exp + '.' + sig;
}

async function checkAuth(request, env) {
  if (!env.APP_PASSWORD) return true; // demo mode — set the secret before real use
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)'));
  if (!m) return false;
  const [expStr, sig] = m[1].split('.');
  const exp = Number(expStr);
  if (!exp || !sig || exp < Date.now()) return false;
  const expected = await hmacHex(env.APP_PASSWORD, 'irisflow:' + exp);
  return timingSafeEqual(sig, expected);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function handleLogin(request, env) {
  if (!env.APP_PASSWORD) return redirect('/');
  let form;
  try { form = await request.formData(); } catch { return serveLogin(true); }
  const pw = String(form.get('password') || '');
  // Compare via HMAC so mismatched lengths don't short-circuit timing.
  const ok = timingSafeEqual(await hmacHex(env.APP_PASSWORD, pw), await hmacHex(env.APP_PASSWORD, env.APP_PASSWORD));
  if (!ok) return serveLogin(true);
  const token = await makeSession(env);
  return new Response(null, { status: 302, headers: {
    'Location': '/',
    'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Strict`
  }});
}

function handleLogout() {
  return new Response(null, { status: 302, headers: {
    'Location': '/',
    'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`
  }});
}

/* ── Helpers ── */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
function html(body, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'no-cache' } });
}
function redirect(to) {
  return new Response(null, { status: 302, headers: { 'Location': to } });
}
function withSecurity(res) {
  const h = new Headers(res.headers);
  h.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  h.set('X-Frame-Options', 'DENY');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  h.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'");
  return new Response(res.body, { status: res.status, headers: h });
}

/* ── Login page ── */
function serveLogin(failed) {
  return html(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>IrisFlow — Sign in</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#f9f9f7;--panel:#ffffff;--border:#e1e0d9;--ink:#0b0b0b;--ink2:#52514e;--accent:#4a3aa7}
  @media (prefers-color-scheme: dark){:root{--bg:#0d0d0d;--panel:#1a1a19;--border:#2c2c2a;--ink:#fff;--ink2:#c3c2b7;--accent:#9085e9}}
  body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--bg);color:var(--ink);display:flex;align-items:center;justify-content:center;min-height:100vh}
  .card{background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:2.5rem;width:100%;max-width:380px}
  .mark{width:48px;height:48px;border-radius:12px;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.2rem;margin:0 auto .75rem}
  h1{font-size:1.3rem;text-align:center;margin-bottom:1.75rem}
  label{display:block;font-size:.75rem;font-weight:600;color:var(--ink2);text-transform:uppercase;letter-spacing:1px;margin-bottom:.5rem}
  input{width:100%;padding:.8rem 1rem;background:var(--bg);border:1px solid var(--border);border-radius:10px;color:var(--ink);font-size:1rem;outline:none}
  input:focus{border-color:var(--accent)}
  button{width:100%;padding:.8rem;background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:1.25rem}
  .err{border:1px solid #d03b3b;color:#d03b3b;padding:.6rem .8rem;border-radius:8px;font-size:.85rem;margin-bottom:1rem;text-align:center}
</style></head><body>
<main class="card">
  <div class="mark">IF</div><h1>IrisFlow</h1>
  ${failed ? '<div class="err">Incorrect passphrase. Try again.</div>' : ''}
  <form method="POST" action="/login">
    <label for="pw">Passphrase</label>
    <input id="pw" type="password" name="password" autofocus required autocomplete="current-password">
    <button type="submit">Sign in</button>
  </form>
</main></body></html>`, failed ? 401 : 200);
}
