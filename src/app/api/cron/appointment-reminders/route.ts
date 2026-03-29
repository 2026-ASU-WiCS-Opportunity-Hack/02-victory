import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Sends reminder emails for appointments in the next 48 hours (when Resend is configured).
 * Trigger: Vercel Cron (see vercel.json) or manual GET with Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const auth = request.headers.get("authorization");
  const secretOk =
    process.env.CRON_SECRET &&
    auth === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !secretOk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://02-victory.vercel.app";

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  if (!resendKey || !from) {
    return NextResponse.json({
      skipped: true,
      message: "RESEND_API_KEY and RESEND_FROM_EMAIL not set — no emails sent.",
    });
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = new Date();
  const until = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const { data: rows, error } = await supabase
    .from("appointments")
    .select("id, title, starts_at, notes, clients ( email, first_name, last_name )")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", until.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  const failures: string[] = [];

  for (const row of rows ?? []) {
    const raw = row.clients as
      | { email?: string | null; first_name?: string; last_name?: string }
      | { email?: string | null; first_name?: string; last_name?: string }[]
      | null;
    const c = Array.isArray(raw) ? raw[0] : raw;
    const email = c?.email?.trim();
    if (!email) continue;

    const when = new Date(row.starts_at).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const title = row.title ?? "Appointment";
    const name = c ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() : "Hello";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Reminder: ${title} on ${when}`,
        html: `<p>Hi ${name},</p><p>This is a reminder that you have <strong>${title}</strong> scheduled for <strong>${when}</strong>.</p>${row.notes ? `<p>Notes: ${String(row.notes)}</p>` : ""}<p><a href="${appUrl}/portal">View your record</a></p>`,
      }),
    });

    if (res.ok) {
      sent += 1;
    } else {
      const t = await res.text();
      failures.push(`${email}: ${t}`);
    }
  }

  return NextResponse.json({
    appointments: (rows ?? []).length,
    emails_sent: sent,
    failures: failures.length ? failures : undefined,
  });
}
