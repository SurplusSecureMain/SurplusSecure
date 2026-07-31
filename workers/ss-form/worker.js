/**
 * Surplus Secure — Contact Form Worker
 * Relays form submissions to a Google Apps Script web app
 * which sends an email via Kelli's Gmail (kelli@surplussecure.com).
 *
 * Secrets (set via `wrangler secret put`):
 *   APPS_SCRIPT_URL    — full /exec URL of the deployed Apps Script web app
 *   APPS_SCRIPT_SECRET — shared secret matching SHARED_SECRET in the Apps Script
 *   CAPTCHA_SECRET_KEY — Cloudflare Turnstile secret key for surplussecure.com
 *
 * Routes:
 *   POST /                   — contact form submission
 *     firstName  (required)
 *     phone      (optional if email provided)
 *     email      (optional if phone provided)
 *     website    (honeypot — silently succeed if filled)
 *     cf-turnstile-response (required — verified against Turnstile before relay)
 *   POST /api/data-request   — GDPR/CCPA data export request (no DB to query;
 *                              relays a notice to Kelli so she can respond directly)
 *   POST /api/data-delete    — GDPR/CCPA data deletion request (same relay pattern)
 *
 * There is no database behind this Worker — form submissions are relayed
 * directly to Kelli's inbox and not persisted here. The DSR endpoints exist
 * because the AEO Site Protocol requires them, but since there's nothing
 * stored server-side to programmatically export or purge, they forward a
 * confirmation notice through the same Apps Script relay so Kelli can act on
 * the request in her own inbox (e.g. deleting a prior email thread).
 */

async function verifyTurnstile(token, secretKey, ip) {
  if (!token) return false;
  const body = new URLSearchParams();
  body.set("secret", secretKey);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await resp.json().catch(() => ({ success: false }));
  return data.success === true;
}

// Relays an arbitrary lead-style payload through the same Apps Script /exec
// pathway the contact form uses. Handles the redirect-to-GET quirk documented
// inline below.
async function relayToAppsScript(env, payload) {
  const first = await fetch(env.APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: env.APPS_SCRIPT_SECRET, website: "", ...payload }),
    redirect: "manual",
  });

  let upstream = first;
  if (first.status >= 300 && first.status < 400) {
    const loc = first.headers.get("location");
    if (!loc) {
      console.error("Apps Script redirect missing Location:", first.status);
      return false;
    }
    upstream = await fetch(loc, { method: "GET" });
  }

  const text = await upstream.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  if (upstream.ok && data.success) return true;

  console.error("Apps Script relay failed:", upstream.status, text.slice(0, 200));
  return false;
}

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { ...cors, "Content-Type": "application/json" },
      });

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/data-request" || url.pathname === "/api/data-delete") {
        const fd = await request.formData();
        const requestEmail = (fd.get("email") || "").toString().trim();
        if (!requestEmail || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(requestEmail)) {
          return json({ success: false, error: "Please provide a valid email address." }, 400);
        }
        const kind = url.pathname === "/api/data-delete" ? "Deletion" : "Export";
        const ok = await relayToAppsScript(env, {
          firstName: `[Privacy — Data ${kind} Request]`,
          phone: "",
          email: requestEmail,
        });
        if (!ok) return json({ success: false, error: "Could not deliver your request. Please email kelli@surplussecure.com directly." }, 500);
        return json({ success: true, message: `Your data ${kind.toLowerCase()} request was received. We'll follow up at ${requestEmail}.` });
      }

      const fd = await request.formData();
      const firstName = (fd.get("firstName") || "").toString().trim();
      const phone = (fd.get("phone") || "").toString().trim();
      const email = (fd.get("email") || "").toString().trim();
      const website = (fd.get("website") || "").toString().trim();
      const turnstileToken = (fd.get("cf-turnstile-response") || "").toString().trim();

      if (website) return json({ success: true });
      if (!firstName) return json({ success: false, error: "Please enter your first name." }, 400);
      if (!phone && !email) {
        return json({ success: false, error: "Please provide a phone number or email." }, 400);
      }

      const captchaOk = await verifyTurnstile(turnstileToken, env.CAPTCHA_SECRET_KEY, request.headers.get("CF-Connecting-IP"));
      if (!captchaOk) {
        return json({ success: false, error: "Verification failed. Please try again." }, 400);
      }

      // Apps Script /exec returns 302 to script.googleusercontent.com/macros/echo;
      // the redirect must be followed as GET (the body is stashed server-side via
      // the user_content_key in the redirect URL). Workers fetch follows automatically,
      // but we follow manually to keep diagnostics easy and avoid any method-preservation
      // surprises. (Handled inside relayToAppsScript.)
      const ok = await relayToAppsScript(env, { firstName, phone, email });
      if (!ok) return json({ success: false, error: "Delivery failed" }, 500);
      return json({ success: true });
    } catch (err) {
      console.error("Worker error:", err);
      return json({ success: false, error: "Server error" }, 500);
    }
  },
};
