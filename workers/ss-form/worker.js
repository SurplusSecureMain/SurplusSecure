/**
 * Surplus Secure — Contact Form Worker
 * Relays form submissions to a Google Apps Script web app
 * which sends an email via Kelli's Gmail (kelli@surplussecure.com).
 *
 * Secrets (set via `wrangler secret put`):
 *   APPS_SCRIPT_URL    — full /exec URL of the deployed Apps Script web app
 *   APPS_SCRIPT_SECRET — shared secret matching SHARED_SECRET in the Apps Script
 *
 * Form fields:
 *   firstName  (required)
 *   phone      (optional if email provided)
 *   email      (optional if phone provided)
 *   website    (honeypot — silently succeed if filled)
 */

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

    try {
      const fd = await request.formData();
      const firstName = (fd.get("firstName") || "").toString().trim();
      const phone = (fd.get("phone") || "").toString().trim();
      const email = (fd.get("email") || "").toString().trim();
      const website = (fd.get("website") || "").toString().trim();

      if (website) return json({ success: true });
      if (!firstName) return json({ success: false, error: "Please enter your first name." }, 400);
      if (!phone && !email) {
        return json({ success: false, error: "Please provide a phone number or email." }, 400);
      }

      // Apps Script /exec returns 302 to script.googleusercontent.com/macros/echo;
      // the redirect must be followed as GET (the body is stashed server-side via
      // the user_content_key in the redirect URL). Workers fetch follows automatically,
      // but we follow manually to keep diagnostics easy and avoid any method-preservation
      // surprises.
      const first = await fetch(env.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: env.APPS_SCRIPT_SECRET,
          firstName,
          phone,
          email,
          website: "",
        }),
        redirect: "manual",
      });

      let upstream = first;
      if (first.status >= 300 && first.status < 400) {
        const loc = first.headers.get("location");
        if (!loc) {
          console.error("Apps Script redirect missing Location:", first.status);
          return json({ success: false, error: "Delivery failed" }, 500);
        }
        upstream = await fetch(loc, { method: "GET" });
      }

      const text = await upstream.text();
      let data = {};
      try { data = JSON.parse(text); } catch {}
      if (upstream.ok && data.success) return json({ success: true });

      console.error("Apps Script relay failed:", upstream.status, text.slice(0, 200));
      return json({ success: false, error: "Delivery failed" }, 500);
    } catch (err) {
      console.error("Worker error:", err);
      return json({ success: false, error: "Server error" }, 500);
    }
  },
};
