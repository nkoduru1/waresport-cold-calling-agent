import { getEmailSettings } from "@/lib/store";

function getConfig() {
  const stored = getEmailSettings();
  return {
    apiKey: stored?.resend_api_key || process.env.RESEND_API_KEY || "",
    fromEmail: stored?.from_email || process.env.EMAIL_FROM || "onboarding@resend.dev",
  };
}

function nextBusinessDay(days: number): Date {
  const d = new Date();
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  d.setUTCHours(15, 0, 0, 0); // 10 AM ET = 15:00 UTC
  return d;
}

function formatDateET(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    timeZone: "America/New_York",
  });
}

function formatTimeET(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
    timeZone: "America/New_York",
  });
}

async function sendResendEmail(params: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  scheduledAt?: Date;
  attachments?: Array<{ filename: string; content: string }>;
}): Promise<boolean> {
  const body: Record<string, unknown> = {
    from: params.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  };
  if (params.scheduledAt) body.scheduled_at = params.scheduledAt.toISOString();
  if (params.attachments) body.attachments = params.attachments;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${params.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("[email] Resend error:", await res.text());
    return false;
  }
  return true;
}

export async function sendDemoFollowUpEmail(toEmail: string, clubName: string): Promise<boolean> {
  const { apiKey, fromEmail } = getConfig();

  if (!apiKey) {
    console.warn("[email] No API key configured — skipping emails to", toEmail);
    return false;
  }

  const demoDate = nextBusinessDay(3);
  const dateStr = formatDateET(demoDate);
  const timeStr = formatTimeET(demoDate);

  const now = Date.now();

  const minus24 = new Date(demoDate.getTime() - 24 * 60 * 60 * 1000);
  const minus1 = new Date(demoDate.getTime() - 60 * 60 * 1000);
  const plus24 = new Date(demoDate.getTime() + 24 * 60 * 60 * 1000);
  const plus48 = new Date(demoDate.getTime() + 48 * 60 * 60 * 1000);

  const sharedBase = { apiKey, from: fromEmail, to: toEmail };

  const emails: Promise<boolean>[] = [
    // 1. Immediate confirmation
    sendResendEmail({
      ...sharedBase,
      subject: `Your Waresport Demo is Confirmed — ${dateStr}`,
      html: `
        <p>Hi ${clubName},</p>
        <p>Great news — your Waresport demo is <strong>confirmed for ${dateStr} at ${timeStr}</strong>.</p>
        <p>We'll show you how Waresport helps sports clubs save 15–20 hours per week on registrations, scheduling, and payments — all in one platform.</p>
        <p>If you need to reschedule, just reply to this email and we'll find a time that works.</p>
        <p>In the meantime, feel free to explore <a href="https://waresport.com">waresport.com</a>.</p>
        <p>Looking forward to connecting!<br/>The Waresport Team</p>
      `,
    }),
  ];

  // 2. 24-hour reminder (only schedule if it's still in the future)
  if (minus24.getTime() > now + 5 * 60 * 1000) {
    emails.push(
      sendResendEmail({
        ...sharedBase,
        subject: `Reminder: Your Waresport Demo is Tomorrow at ${timeStr}`,
        html: `
          <p>Hi ${clubName},</p>
          <p>Just a reminder that your Waresport demo is <strong>tomorrow, ${dateStr} at ${timeStr}</strong>.</p>
          <p>We're looking forward to showing you how to save hours every week on club admin. See you then!</p>
          <p>Questions before the call? Just reply to this email.<br/>The Waresport Team</p>
        `,
        scheduledAt: minus24,
      })
    );
  }

  // 3. 1-hour reminder
  if (minus1.getTime() > now + 5 * 60 * 1000) {
    emails.push(
      sendResendEmail({
        ...sharedBase,
        subject: `Starting in 1 Hour: Your Waresport Demo`,
        html: `
          <p>Hi ${clubName},</p>
          <p>Your Waresport demo starts in <strong>1 hour</strong> at ${timeStr}.</p>
          <p>Our team will be reaching out shortly. Talk soon!</p>
          <p>The Waresport Team</p>
        `,
        scheduledAt: minus1,
      })
    );
  }

  // 4. 24-hour post-demo follow-up
  emails.push(
    sendResendEmail({
      ...sharedBase,
      subject: `Following Up — How Was Your Waresport Demo?`,
      html: `
        <p>Hi ${clubName},</p>
        <p>We hope you enjoyed your Waresport demo yesterday! We'd love to hear your thoughts.</p>
        <p>Do you have any questions, or are you ready to get started? We can set up a free trial so your team can explore the platform at your own pace.</p>
        <p>Just reply here and we'll get back to you within a few hours.</p>
        <p>Best,<br/>The Waresport Team</p>
      `,
      scheduledAt: plus24,
    })
  );

  // 5. 48-hour post-demo follow-up
  emails.push(
    sendResendEmail({
      ...sharedBase,
      subject: `Still Thinking It Over? We're Here to Help`,
      html: `
        <p>Hi ${clubName},</p>
        <p>I wanted to circle back in case you had any questions after your Waresport demo.</p>
        <p>Many club directors find that the biggest wins come from automating registration renewals and payment reminders — tasks that typically eat 5-10 hours a week. We'd be happy to show you exactly how this would look for your club.</p>
        <p>Ready when you are — just reply or visit <a href="https://waresport.com">waresport.com</a> to get started.</p>
        <p>Best,<br/>The Waresport Team</p>
      `,
      scheduledAt: plus48,
    })
  );

  try {
    await Promise.all(emails);
    console.log(`[email] Sent ${emails.length} emails (confirmation + reminders + follow-ups) to`, toEmail);
    return true;
  } catch (e) {
    console.error("[email] Failed:", e);
    return false;
  }
}
