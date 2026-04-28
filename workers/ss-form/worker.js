/**
 * Surplus Secure — Contact Form Worker
 * ─────────────────────────────────────
 * Deploy as:  ss-form  (Cloudflare Workers)
 * Sends styled HTML email to Kelli via MailChannels
 * 
 * Form fields:
 *   firstName  (required)
 *   phone      (optional if email provided)
 *   email      (optional if phone provided)
 *   — at least one of phone/email is required
 *
 * No environment variables needed — everything is self-contained.
 */

const RECIPIENT_EMAIL = "kelli@surplussecure.com";
const RECIPIENT_NAME  = "Kelli Meeks — Surplus Secure";
const SENDER_EMAIL    = "noreply@surplussecure.com";
const SENDER_NAME     = "Surplus Secure Website";

export default {
  async fetch(request, env) {

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const formData = await request.formData();

      // Honeypot — if filled, silently succeed (bot trap)
      if (formData.get("website")) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const firstName = (formData.get("firstName") || "").trim();
      const email     = (formData.get("email") || "").trim();
      const phone     = (formData.get("phone") || "").trim();
      const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Detroit" });

      // Validation
      if (!firstName) {
        return new Response(JSON.stringify({ success: false, error: "First name is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!email && !phone) {
        return new Response(JSON.stringify({ success: false, error: "Please provide a phone number or email" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build reply action — adapts based on what the person provided
      let replyButton = "";
      if (email && phone) {
        replyButton = `
          <a href="mailto:${email}" style="display:inline-block;background:#C9A55A;color:#1C2340;font-weight:700;padding:10px 24px;border-radius:9999px;font-size:13px;text-decoration:none;margin-right:8px;">Reply to ${firstName}</a>
          <a href="tel:${phone}" style="display:inline-block;background:#1C2340;color:#C9A55A;font-weight:700;padding:10px 24px;border-radius:9999px;font-size:13px;text-decoration:none;border:2px solid #C9A55A;">Call ${firstName}</a>`;
      } else if (email) {
        replyButton = `<a href="mailto:${email}" style="display:inline-block;background:#C9A55A;color:#1C2340;font-weight:700;padding:10px 24px;border-radius:9999px;font-size:13px;text-decoration:none;">Reply to ${firstName}</a>`;
      } else {
        replyButton = `<a href="tel:${phone}" style="display:inline-block;background:#C9A55A;color:#1C2340;font-weight:700;padding:10px 24px;border-radius:9999px;font-size:13px;text-decoration:none;">Call ${firstName}</a>`;
      }

      // Styled HTML email — Surplus Secure brand (navy #1C2340, gold #C9A55A)
      const htmlBody = `
<div style="font-family:Georgia,'Times New Roman',serif;max-width:600px;margin:0 auto;padding:24px;background:#f7f5f0;">
  <div style="background:#1C2340;padding:20px 24px;border-radius:8px 8px 0 0;">
    <h2 style="color:#C9A55A;margin:0;font-size:20px;font-family:Georgia,serif;">New Inquiry from Website</h2>
    <p style="color:rgba(255,255,255,0.5);margin:4px 0 0;font-size:13px;">${timestamp}</p>
  </div>
  <div style="background:white;padding:24px;border:1px solid #e8e4de;border-top:none;border-radius:0 0 8px 8px;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:10px 0;color:#888;width:100px;vertical-align:top;">Name</td>
        <td style="padding:10px 0;color:#1C2340;font-weight:600;font-size:16px;">${firstName}</td>
      </tr>
      ${phone ? `<tr>
        <td style="padding:10px 0;color:#888;vertical-align:top;">Phone</td>
        <td style="padding:10px 0;"><a href="tel:${phone}" style="color:#1C2340;font-weight:600;text-decoration:none;font-size:15px;">${phone}</a></td>
      </tr>` : ""}
      ${email ? `<tr>
        <td style="padding:10px 0;color:#888;vertical-align:top;">Email</td>
        <td style="padding:10px 0;"><a href="mailto:${email}" style="color:#C9A55A;text-decoration:none;">${email}</a></td>
      </tr>` : ""}
    </table>
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;text-align:center;">
      ${replyButton}
    </div>
    <p style="margin:16px 0 0;color:#aaa;font-size:11px;text-align:center;">This message was sent from the Surplus Secure website contact form.</p>
  </div>
</div>`.trim();

      // Plain text fallback
      const plainText = `New inquiry from surplussecure.com\n\nName: ${firstName}\nPhone: ${phone || "Not provided"}\nEmail: ${email || "Not provided"}\nTime: ${timestamp}`;

      // Set reply-to based on what they provided
      const replyTo = email
        ? { email, name: firstName }
        : undefined;

      const personalizations = {
        to: [{ email: RECIPIENT_EMAIL, name: RECIPIENT_NAME }],
      };
      if (replyTo) personalizations.reply_to = replyTo;

      // Send via MailChannels
      const mailRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [personalizations],
          from: { email: SENDER_EMAIL, name: SENDER_NAME },
          subject: `New Inquiry – ${firstName}${phone ? " – " + phone : ""}`,
          content: [
            { type: "text/plain", value: plainText },
            { type: "text/html",  value: htmlBody },
          ],
        }),
      });

      if (mailRes.status === 202 || mailRes.status === 200) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        const err = await mailRes.text();
        console.error("MailChannels error:", mailRes.status, err);
        return new Response(JSON.stringify({ success: false, error: "Delivery failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

    } catch (err) {
      console.error("Worker error:", err);
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
