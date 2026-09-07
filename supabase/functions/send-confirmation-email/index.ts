import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Edge Function: Automatically sends a confirmation email to new applicants
// Triggered via Supabase Database Webhook (on INSERT into 'registrations' table)
// or called directly via POST request.

interface WebhookPayload {
  type?: "INSERT" | "UPDATE" | "DELETE";
  table?: string;
  record?: RecordData;
  // If invoked directly from client or custom webhook:
  name?: string;
  email?: string;
  departments?: string[];
  roll_no?: string;
  year?: string;
  branch?: string;
}

interface RecordData {
  id?: string;
  name: string;
  email: string;
  roll_no?: string;
  branch?: string;
  year?: string;
  departments?: string[];
  [key: string]: unknown;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "LEAD Society <onboarding@resend.dev>";
const WHATSAPP_COMMUNITY_URL =
  Deno.env.get("WHATSAPP_COMMUNITY_URL") ||
  "https://chat.whatsapp.com/YOUR_COMMUNITY_INVITE_CODE";
const INSTAGRAM_URL =
  Deno.env.get("INSTAGRAM_URL") || "https://instagram.com/lead_tiet";

function generateEmailHtml(data: {
  name: string;
  departments: string[];
  rollNo?: string;
  branch?: string;
  year?: string;
}) {
  const deptList = data.departments && data.departments.length > 0
    ? data.departments.join(", ")
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
      <h2 class="greeting">Hey ${data.name || "Candidate"},</h2>
      <p>
        Your application for <strong>LEAD</strong> has been successfully received and logged into our system!
      </p>

      <div class="summary-card">
        <div class="summary-item"><strong>Department(s) Applied:</strong> ${deptList}</div>
        ${data.rollNo ? `<div class="summary-item"><strong>Roll Number:</strong> ${data.rollNo}</div>` : ""}
        ${data.branch ? `<div class="summary-item"><strong>Branch & Year:</strong> ${data.branch} (${data.year || ""})</div>` : ""}
      </div>

      <div class="cta-card">
        <div class="cta-title">📢 Action Required: Join WhatsApp Community</div>
        <p class="cta-desc">
          All vital recruitment updates, interview round slots, tasks, and shortlists will be communicated strictly via our official WhatsApp community.
        </p>
        <a href="${WHATSAPP_COMMUNITY_URL}" class="btn-whatsapp" target="_blank" rel="noopener noreferrer">
          👉 Join WhatsApp Community
        </a>
      </div>

      <p style="font-size: 14px; color: #a89474;">
        Don't forget to stay tuned on our official Instagram page for real-time announcements, stories, and society highlights:
      </p>

      <div style="text-align: center; margin: 16px 0 24px;">
        <a href="${INSTAGRAM_URL}" class="btn-instagram" target="_blank" rel="noopener noreferrer">
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

  try {
    const payload: WebhookPayload = await req.json();

    // Extract record whether triggered by Supabase Webhook or direct POST
    const record: RecordData = payload.record || {
      name: payload.name || "Candidate",
      email: payload.email || "",
      roll_no: payload.roll_no,
      branch: payload.branch,
      year: payload.year,
      departments: payload.departments,
    };

    if (!record.email) {
      return new Response(
        JSON.stringify({ error: "Missing recipient email address." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!RESEND_API_KEY) {
      console.warn(
        "RESEND_API_KEY is not set. Email delivery skipped. Check your Supabase Edge Function secrets."
      );
      return new Response(
        JSON.stringify({
          warning:
            "RESEND_API_KEY missing in environment secrets. Email simulated.",
          record,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const htmlBody = generateEmailHtml({
      name: record.name,
      departments: record.departments || [],
      rollNo: record.roll_no,
      branch: record.branch,
      year: record.year,
    });

    // Send email using Resend HTTP API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [record.email],
        subject: "Application Received | Welcome to LEAD Recruitments 2026",
        html: htmlBody,
      }),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendResult);
      return new Response(JSON.stringify({ error: resendResult }), {
        status: resendResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Confirmation email successfully queued for ${record.email}`,
        data: resendResult,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Edge function execution error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
