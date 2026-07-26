// Petlife website form handler.
// Validates a public form submission, stores it, then emails the team.
//
// Deploy:  supabase functions deploy submit-form --no-verify-jwt
// Secrets: supabase secrets set RESEND_API_KEY=... NOTIFY_FROM="Petlife <website@petlifeindia.co>"
//
// The service-role key is injected automatically by the Edge runtime.

import { createClient } from "jsr:@supabase/supabase-js@2";

const CONTACT_INBOX = "info@petlifeindia.co";
const HR_INBOX = "hr@petlifeindia.co";

const SERVICES = [
  "walker", "vet", "pet_taxi", "pet_shop", "pet_boarding", "trainer", "groomer",
] as const;

const SERVICE_LABELS: Record<string, string> = {
  walker: "Dog Walker",
  vet: "Veterinarian",
  pet_taxi: "Pet Taxi",
  pet_shop: "Pet Shop",
  pet_boarding: "Pet Boarding",
  trainer: "Trainer",
  groomer: "Groomer",
};

const POSITIONS = [
  "ui_ux_designer", "test_engineer", "digital_brand_marketing", "seo",
] as const;

const POSITION_LABELS: Record<string, string> = {
  ui_ux_designer: "UI/UX Designer Intern",
  test_engineer: "Test Engineer (QA) Intern",
  digital_brand_marketing: "Digital Brand Marketing Specialist Intern",
  seo: "Search Engine Optimizer (SEO) Intern",
};

const EXPERIENCE_LEVELS = ["fresher", "lt3", "3to6", "6to10", "10plus"] as const;

const EXPERIENCE_LABELS: Record<string, string> = {
  fresher: "Fresher",
  lt3: "Less than 3 years",
  "3to6": "3 to 6 years",
  "6to10": "6 to 10 years",
  "10plus": "10+ years",
};

const MAX_RESUME_BYTES = 4 * 1024 * 1024;
const MAX_COVER_WORDS = 200;

const ALLOWED_ORIGINS = [
  "https://petlifeindia.co",
  "https://www.petlifeindia.co",
];

function corsHeaders(origin: string | null): Record<string, string> {
  // Echo an allowed origin; fall back to the canonical domain. Localhost is
  // allowed so the site can be tested before DNS is pointed.
  const isLocal = !!origin && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const allow = origin && (ALLOWED_ORIGINS.includes(origin) || isLocal)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

// Escape anything that lands in the notification HTML.
const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const row = (label: string, value: string) =>
  `<tr><td style="padding:6px 14px 6px 0;color:#6B7280;font:14px sans-serif;white-space:nowrap">${esc(label)}</td>` +
  `<td style="padding:6px 0;color:#1C1C1E;font:600 14px sans-serif">${esc(value) || "—"}</td></tr>`;

type Attachment = { filename: string; content: string };

async function sendEmail(
  to: string,
  subject: string,
  rowsHtml: string,
  replyTo?: string,
  attachments?: Attachment[],
) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    console.warn("RESEND_API_KEY not set — stored submission but sent no email");
    return false;
  }
  const from = Deno.env.get("NOTIFY_FROM") ?? "Petlife <website@petlifeindia.co>";

  const html = `<div style="background:#F7F3ED;padding:28px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;padding:28px">
      <p style="margin:0 0 18px;font:700 18px sans-serif;color:#1F4429">${esc(subject)}</p>
      <table style="border-collapse:collapse;width:100%">${rowsHtml}</table>
      <p style="margin:22px 0 0;font:13px sans-serif;color:#8E8E93">
        Sent from the petlifeindia.co website.</p>
    </div></div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      ...(replyTo && isEmail(replyTo) ? { reply_to: replyTo } : {}),
      ...(attachments && attachments.length ? { attachments } : {}),
    }),
  });

  if (!res.ok) {
    console.error("Resend failed", res.status, await res.text());
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Send valid JSON." }, 400, origin);
  }

  // Honeypot: real people leave this empty.
  if (str(body.company, 80)) return json({ ok: true }, 200, origin);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const sourceIp = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const userAgent = str(req.headers.get("user-agent") ?? "", 400) || null;
  const form = str(body.form, 20);

  // ------------------------------------------------------------- contact ---
  if (form === "contact") {
    const name = str(body.name, 120);
    const email = str(body.email, 160);
    const phone = str(body.phone, 24);
    const subject = str(body.subject, 160);
    const message = str(body.message, 4000);

    if (name.length < 2) return json({ error: "Enter your name." }, 400, origin);
    if (!isEmail(email)) return json({ error: "Enter a valid email address." }, 400, origin);
    if (message.length < 5) return json({ error: "Tell us a little more in the message." }, 400, origin);

    const { data, error } = await supabase
      .from("website_contact_messages")
      .insert({
        name, email,
        phone: phone || null,
        subject: subject || null,
        message,
        source_ip: sourceIp,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (error) {
      console.error("contact insert failed", error);
      return json({ error: "We couldn't save that. Please try again." }, 500, origin);
    }

    const sent = await sendEmail(
      CONTACT_INBOX,
      `New contact message from ${name}`,
      row("Name", name) + row("Email", email) + row("Phone", phone) +
        row("Subject", subject) + row("Message", message),
      email,
    );
    if (sent) await supabase.from("website_contact_messages").update({ email_sent: true }).eq("id", data.id);

    return json({ ok: true }, 200, origin);
  }

  // --------------------------------------------------------------- buddy ---
  if (form === "buddy") {
    const name = str(body.name, 120);
    const service = str(body.service, 20);
    const phone = str(body.phone, 24);
    const email = str(body.email, 160);
    const location = str(body.location, 160);
    const note = str(body.note, 2000);
    const experience = Number(body.experience_years);

    if (name.length < 2) return json({ error: "Enter your name." }, 400, origin);
    if (!SERVICES.includes(service as typeof SERVICES[number]))
      return json({ error: "Choose the service you offer." }, 400, origin);
    if (phone.length < 6) return json({ error: "Enter a valid phone number." }, 400, origin);
    if (!isEmail(email)) return json({ error: "Enter a valid email address." }, 400, origin);
    if (location.length < 2) return json({ error: "Enter your city or area." }, 400, origin);
    if (!Number.isInteger(experience) || experience < 0 || experience > 10)
      return json({ error: "Choose your years of experience." }, 400, origin);

    const { data, error } = await supabase
      .from("website_buddy_applications")
      .insert({
        name, service, phone, email, location,
        experience_years: experience,
        note: note || null,
        source_ip: sourceIp,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (error) {
      console.error("buddy insert failed", error);
      return json({ error: "We couldn't save that. Please try again." }, 500, origin);
    }

    const sent = await sendEmail(
      HR_INBOX,
      `New Pet Buddy application — ${SERVICE_LABELS[service]} in ${location}`,
      row("Name", name) + row("Service", SERVICE_LABELS[service]) + row("Phone", phone) +
        row("Email", email) + row("Location", location) +
        row("Experience", experience === 10 ? "10+ years" : `${experience} year(s)`) +
        row("Note", note),
      email,
    );
    if (sent) await supabase.from("website_buddy_applications").update({ email_sent: true }).eq("id", data.id);

    return json({ ok: true }, 200, origin);
  }

  // -------------------------------------------------------------- career ---
  if (form === "career") {
    const name = str(body.name, 120);
    const phone = str(body.phone, 24);
    const email = str(body.email, 160);
    const position = str(body.position, 40);
    const experienceLevel = str(body.experience_level, 20);
    const coverNote = str(body.cover_note, 3000);
    const resumeName = str(body.resume_filename, 200);
    const resumeB64 = typeof body.resume_base64 === "string" ? body.resume_base64 : "";

    if (name.length < 2) return json({ error: "Enter your full name." }, 400, origin);
    if (phone.length < 6) return json({ error: "Enter a valid phone number." }, 400, origin);
    if (!isEmail(email)) return json({ error: "Enter a valid email address." }, 400, origin);
    if (!POSITIONS.includes(position as typeof POSITIONS[number]))
      return json({ error: "Choose the role you're applying for." }, 400, origin);
    if (!EXPERIENCE_LEVELS.includes(experienceLevel as typeof EXPERIENCE_LEVELS[number]))
      return json({ error: "Choose your experience level." }, 400, origin);
    if (coverNote.length < 10)
      return json({ error: "Tell us a little about yourself." }, 400, origin);

    const words = coverNote.trim().split(/\s+/).length;
    if (words > MAX_COVER_WORDS)
      return json({ error: `Please keep your profile under ${MAX_COVER_WORDS} words.` }, 400, origin);

    if (!resumeB64 || !resumeName)
      return json({ error: "Attach your resume (PDF or Word)." }, 400, origin);
    if (!/\.(pdf|docx?)$/i.test(resumeName))
      return json({ error: "Upload a PDF or Word document." }, 400, origin);

    // Decode and size-check the resume before it touches storage.
    let bytes: Uint8Array;
    try {
      const binary = atob(resumeB64);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    } catch {
      return json({ error: "That file couldn't be read. Please try another." }, 400, origin);
    }
    if (bytes.byteLength > MAX_RESUME_BYTES)
      return json({ error: "That file is over 4 MB. Please upload a smaller one." }, 400, origin);

    const ext = (resumeName.match(/\.(pdf|docx?)$/i) ?? [".pdf"])[0].toLowerCase();
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "applicant";
    const objectPath = `${position}/${crypto.randomUUID()}-${safeName}${ext}`;

    const contentType = ext === ".pdf"
      ? "application/pdf"
      : ext === ".docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/msword";

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(objectPath, bytes, { contentType, upsert: false });

    if (uploadError) {
      console.error("resume upload failed", uploadError);
      return json({ error: "We couldn't save your resume. Please try again." }, 500, origin);
    }

    const { data, error } = await supabase
      .from("website_job_applications")
      .insert({
        name, phone, email, position,
        experience_level: experienceLevel,
        cover_note: coverNote,
        resume_path: objectPath,
        resume_filename: resumeName,
        source_ip: sourceIp,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (error) {
      console.error("career insert failed", error);
      // Don't leave an orphaned file behind if the row didn't land.
      await supabase.storage.from("resumes").remove([objectPath]);
      return json({ error: "We couldn't save that. Please try again." }, 500, origin);
    }

    const sent = await sendEmail(
      HR_INBOX,
      `New application — ${POSITION_LABELS[position]} — ${name}`,
      row("Name", name) + row("Position", POSITION_LABELS[position]) +
        row("Experience", EXPERIENCE_LABELS[experienceLevel]) +
        row("Phone", phone) + row("Email", email) +
        row("Resume", resumeName) + row("Profile", coverNote),
      email,
      [{ filename: resumeName, content: resumeB64 }],
    );
    if (sent) await supabase.from("website_job_applications").update({ email_sent: true }).eq("id", data.id);

    return json({ ok: true }, 200, origin);
  }

  return json({ error: "Unknown form." }, 400, origin);
});
