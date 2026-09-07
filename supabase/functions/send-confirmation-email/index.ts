import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Edge Function: sends the confirmation email to a new applicant.
//
// Triggered by the Supabase Database Webhook on INSERT into 'registrations'.
// The client also invokes it as a fallback; a single-statement atomic claim on
// 'email_sent_at' guarantees exactly one email per registration regardless of
// how many times (or how concurrently) the function is called.
//
// The caller only supplies a registration id. All applicant data is re-read
// from the database with the service role key, so a caller can never dictate
// the recipient address or inject content into the message.

interface WebhookPayload {
  type?: "INSERT" | "UPDATE" | "DELETE";
  table?: string;
  record?: { id?: string; [key: string]: unknown };
  // Direct invocation from the client passes the id at the top level.
  id?: string;
}

interface Registration {
  id: string;
  name: string;
  email: string;
  roll_no?: string | null;
  branch?: string | null;
  year?: string | null;
  departments?: string[] | null;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "LEAD Society <onboarding@resend.dev>";
const WHATSAPP_COMMUNITY_URL = Deno.env.get("WHATSAPP_COMMUNITY_URL") || "";
const INSTAGRAM_URL = Deno.env.get("INSTAGRAM_URL") || "https://instagram.com/lead_tiet";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

/** Escapes text before it is interpolated into the email's HTML body. */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Returns the reason the function is misconfigured, or null when it is ready.
 * Checked before the send is claimed so a misconfigured deploy fails loudly
 * and remains retryable instead of silently mailing dead links.
 */
function configError(): string | null {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not available to this function.";
  }
  if (!RESEND_API_KEY) {
    return "RESEND_API_KEY is not set. Add it to the Edge Function secrets.";
  }
  if (!WHATSAPP_COMMUNITY_URL || WHATSAPP_COMMUNITY_URL.includes("YOUR_COMMUNITY_INVITE_CODE")) {
    return "WHATSAPP_COMMUNITY_URL is unset or still the placeholder invite link.";
  }
  return null;
}

function generateEmailHtml(reg: Registration) {
  const departments = reg.departments ?? [];
  const deptList = departments.length > 0
    ? departments.map(esc).join(", ")
    : "LEAD Society";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received - LEAD Recruitments 2026</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0d0906;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e0d6c4;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #14100c;
      border: 1px solid #2a2218;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(180deg, #1f1812 0%, #14100c 100%);
      padding: 36px 30px 24px;
      text-align: center;
      border-bottom: 2px solid #be1e1e;
    }
    .brand-title {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 3px;
      color: #f5eedf;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 13px;
      letter-spacing: 2px;
      color: #7dd3fc;
      margin-top: 6px;
      text-transform: uppercase;
    }
    .content {
      padding: 32px 30px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #f5eedf;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .summary-card {
      background: #1a1510;
      border: 1px solid #3d3428;
      border-radius: 6px;
      padding: 16px 20px;
      margin: 22px 0;
    }
    .summary-item {
      font-size: 14px;
      margin: 6px 0;
      color: #c4b393;
    }
    .summary-item strong {
      color: #f5eedf;
    }
    .cta-card {
      background: #1b261b;
      border: 1.5px solid #25d366;
      border-radius: 8px;
      padding: 24px 20px;
      text-align: center;
      margin: 28px 0;
    }
    .cta-title {
      font-size: 18px;
      font-weight: 700;
      color: #25d366;
      margin: 0 0 8px 0;
    }
    .cta-desc {
      font-size: 14px;
      color: #e2f5e8;
      margin: 0 0 18px 0;
    }
    .btn-whatsapp {
      display: inline-block;
      background-color: #25d366;
      color: #0b1c10 !important;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      padding: 13px 28px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);
    }
    .btn-instagram {
      display: inline-block;
      background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
      color: #ffffff !important;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      padding: 11px 22px;
      border-radius: 6px;
      margin-top: 10px;
    }
    .footer {
      background: #0d0906;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #231b14;
      font-size: 12px;
      color: #7a7060;
    }
    .footer a {
      color: #7dd3fc;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">L E A D</h1>
      <div class="brand-sub">Recruitments 2026 // Thapar Institute</div>
    </div>
    <div class="content">
      <h2 class="greeting">Hey ${esc(reg.name) || "Candidate"},</h2>
      <p>
        Your application for <strong>LEAD</strong> has been successfully received and logged into our system!
      </p>

      <div class="summary-card">
        <div class="summary-item"><strong>Department(s) Applied:</strong> ${deptList}</div>
        ${reg.roll_no ? `<div class="summary-item"><strong>Roll Number:</strong> ${esc(reg.roll_no)}</div>` : ""}
        ${reg.branch ? `<div class="summary-item"><strong>Branch &amp; Year:</strong> ${esc(reg.branch)} (${esc(reg.year)})</div>` : ""}
      </div>

      <div class="cta-card">
        <div class="cta-title">📢 Action Required: Join WhatsApp Community</div>
        <p class="cta-desc">
          All vital recruitment updates, interview round slots, tasks, and shortlists will be communicated strictly via our official WhatsApp community.
        </p>
        <a href="${esc(WHATSAPP_COMMUNITY_URL)}" class="btn-whatsapp" target="_blank" rel="noopener noreferrer">
          👉 Join WhatsApp Community
        </a>
      </div>

      <p style="font-size: 14px; color: #a89474;">
        Don't forget to stay tuned on our official Instagram page for real-time announcements, stories, and society highlights:
      </p>

      <div style="text-align: center; margin: 16px 0 24px;">
        <a href="${esc(INSTAGRAM_URL)}" class="btn-instagram" target="_blank" rel="noopener noreferrer">
          📸 Follow @lead_tiet on Instagram
        </a>
      </div>

      <p style="font-size: 13px; color: #8a7a5e; margin-top: 24px;">
        Best of luck with your application!<br>
        <strong>Team LEAD</strong>
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">LEAD Society — Learn • Emerge • Aspire • Discover</p>
      <p style="margin: 0;">Thapar Institute of Engineering & Technology, Patiala</p>
      <p style="margin: 8px 0 0 0;">Questions? Reach out to us at <a href="mailto:lead_sc@thapar.edu">lead_sc@thapar.edu</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Atomically claims the send for `id` by stamping email_sent_at on the row,
 * but only while it is still null. Returns the registration when this call won
 * the claim, or null when another call already sent the email (or the row is
 * gone). The filter and the write are one UPDATE statement, so concurrent
 * webhook and client invocations cannot both win.
 */
async function claimRegistration(id: string): Promise<Registration | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/registrations?id=eq.${encodeURIComponent(id)}&email_sent_at=is.null`,
    {
      method: "PATCH",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ email_sent_at: new Date().toISOString() }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to claim registration ${id}: ${await res.text()}`);
  }

  const rows: Registration[] = await res.json();
  return rows.length > 0 ? rows[0] : null;
}

/** Releases a claim so a later retry can send, recording why this attempt failed. */
async function releaseClaim(id: string, reason: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/registrations?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email_sent_at: null, email_error: reason.slice(0, 500) }),
  }).catch((err) => console.error("Failed to release claim:", err));
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  let claimedId: string | null = null;

  try {
    const payload: WebhookPayload = await req.json();
    const id = payload.record?.id ?? payload.id;

    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing registration id." }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // Fail before claiming, so a misconfigured deploy is loud and retryable.
    const misconfigured = configError();
    if (misconfigured) {
      console.error("Configuration error:", misconfigured);
      return new Response(
        JSON.stringify({ error: misconfigured }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    const registration = await claimRegistration(id);
    if (!registration) {
      // Already sent, or no such row. Either way there is nothing to do, and
      // this is a success for the webhook so it is not retried forever.
      return new Response(
        JSON.stringify({ success: true, skipped: "Email already sent for this registration." }),
        { status: 200, headers: JSON_HEADERS }
      );
    }
    claimedId = registration.id;

    if (!registration.email) {
      await releaseClaim(claimedId, "Registration has no email address.");
      return new Response(
        JSON.stringify({ error: "Registration has no recipient email address." }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [registration.email],
        subject: "Application Received | Welcome to LEAD Recruitments 2026",
        html: generateEmailHtml(registration),
      }),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendResult);
      await releaseClaim(claimedId, JSON.stringify(resendResult));
      return new Response(JSON.stringify({ error: resendResult }), {
        status: resendResponse.status,
        headers: JSON_HEADERS,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Confirmation email successfully queued for ${registration.email}`,
        data: resendResult,
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Edge function execution error:", message);
    if (claimedId) await releaseClaim(claimedId, message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
});
