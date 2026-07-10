import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getResendFromAddress() {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  return configured ? configured : "Arive Executive Travel <bookings@arivegroup.co.uk>";
}

function formatCurrency(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0);
  return `£${numeric.toFixed(2)}`;
}

export function renderEmailWrapper({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return `
    <div style="margin:0;padding:0;background:#f7efe0;font-family:Arial,sans-serif;color:#2f2410;">
      <div style="max-width:600px;margin:0 auto;padding:24px;">
        <div style="background:#0f0f0f;border:1px solid rgba(212,175,55,0.3);border-radius:20px 20px 0 0;padding:24px 24px 18px;">
          <div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#d4af37;">Arive Executive Travel</div>
          <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;color:#f7e8bf;">${escapeHtml(title)}</h1>
        </div>
        <div style="background:#fffaf0;border:1px solid rgba(212,175,55,0.2);border-top:0;border-bottom:0;padding:24px;color:#2f2410;">
          <div style="background:#fffdf8;border:1px solid rgba(212,175,55,0.22);border-radius:16px;padding:18px 20px;margin:0 0 20px;">
            <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#d4af37;font-weight:bold;">Journey Summary</div>
            <div style="margin-top:10px;">
              ${children}
            </div>
          </div>
        </div>
        <div style="background:#0f0f0f;border:1px solid rgba(212,175,55,0.2);border-radius:0 0 20px 20px;padding:16px 24px;color:#a58a4b;font-size:12px;line-height:1.6;">
          <div style="font-weight:bold;color:#f7e8bf;">Arive Executive Travel</div>
          <div><a href="https://arivegroup.co.uk" style="color:#d4af37;text-decoration:none;">arivegroup.co.uk</a></div>
          <div>Support: <a href="mailto:bookings@arivegroup.co.uk" style="color:#d4af37;text-decoration:none;">bookings@arivegroup.co.uk</a></div>
        </div>
      </div>
    </div>
  `;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY is missing; skipping email send.");
    return;
  }

  try {
    await resend.emails.send({
      from: getResendFromAddress(),
      to: [to],
      subject,
      html,
    });
  } catch (error) {
    console.error("Email send failed:", error);
    throw error;
  }
}

export async function sendBookingRequestReceivedEmail({
  to,
  fullName,
  pickup,
  destination,
  journeyDate,
  journeyTime,
  passengers,
  vehicle,
  flightNumber,
  meetAndGreet,
  totalFare,
}: {
  to: string;
  fullName?: string | null;
  pickup?: string | null;
  destination?: string | null;
  journeyDate?: string | null;
  journeyTime?: string | null;
  passengers?: string | number | null;
  vehicle?: string | null;
  flightNumber?: string | null;
  meetAndGreet?: boolean | null;
  totalFare?: string | number | null;
}) {
  const body = `
    <p style="margin:0 0 12px;">Hi ${escapeHtml(fullName || "there")},</p>
    <p style="margin:0 0 12px;">Thank you for requesting your Arive booking. We have received your journey details and our team will review it shortly.</p>
    <p style="margin:0 0 8px;"><strong>Pickup:</strong> ${escapeHtml(pickup)}</p>
    <p style="margin:0 0 8px;"><strong>Destination:</strong> ${escapeHtml(destination)}</p>
    <p style="margin:0 0 8px;"><strong>Journey Date:</strong> ${escapeHtml(journeyDate)}</p>
    <p style="margin:0 0 8px;"><strong>Journey Time:</strong> ${escapeHtml(journeyTime)}</p>
    <p style="margin:0 0 8px;"><strong>Passengers:</strong> ${escapeHtml(passengers)}</p>
    <p style="margin:0 0 8px;"><strong>Vehicle:</strong> ${escapeHtml(vehicle)}</p>
    ${flightNumber ? `<p style="margin:0 0 8px;"><strong>Flight Number:</strong> ${escapeHtml(flightNumber)}</p>` : ""}
    ${meetAndGreet ? `<p style="margin:0 0 8px;"><strong>Meet &amp; Greet:</strong> Yes</p>` : ""}
    <p style="margin:0 0 12px;"><strong>Estimated Total Fare:</strong> ${escapeHtml(formatCurrency(totalFare))}</p>
    <p style="margin:0 0 12px;">This is currently a booking request. Your booking is not secured until Arive accepts it and any required deposit is paid.</p>
    <p style="margin:0;">We will be in touch soon.</p>
  `;

  await sendEmail({
    to,
    subject: "We’ve received your Arive booking request",
    html: renderEmailWrapper({ title: "We’ve received your Arive booking request", children: body }),
  });
}

export async function sendDepositRequestedEmail({
  to,
  fullName,
  pickup,
  destination,
  journeyDate,
  journeyTime,
  vehicle,
  flightNumber,
  totalFare,
  depositDue,
  remainingBalance,
  paymentUrl,
}: {
  to: string;
  fullName?: string | null;
  pickup?: string | null;
  destination?: string | null;
  journeyDate?: string | null;
  journeyTime?: string | null;
  vehicle?: string | null;
  flightNumber?: string | null;
  totalFare?: string | number | null;
  depositDue?: string | number | null;
  remainingBalance?: string | number | null;
  paymentUrl: string;
}) {
  const body = `
    <p style="margin:0 0 12px;">Hi ${escapeHtml(fullName || "there")},</p>
    <p style="margin:0 0 12px;">Your booking with Arive Executive Travel has been accepted. Please pay your deposit using the secure link below.</p>
    <p style="margin:0 0 8px;"><strong>Pickup:</strong> ${escapeHtml(pickup)}</p>
    <p style="margin:0 0 8px;"><strong>Destination:</strong> ${escapeHtml(destination)}</p>
    <p style="margin:0 0 8px;"><strong>Journey Date:</strong> ${escapeHtml(journeyDate)}</p>
    <p style="margin:0 0 8px;"><strong>Journey Time:</strong> ${escapeHtml(journeyTime)}</p>
    <p style="margin:0 0 8px;"><strong>Vehicle:</strong> ${escapeHtml(vehicle)}</p>
    ${flightNumber ? `<p style="margin:0 0 8px;"><strong>Flight Number:</strong> ${escapeHtml(flightNumber)}</p>` : ""}
    <p style="margin:0 0 8px;"><strong>Total Fare:</strong> ${escapeHtml(formatCurrency(totalFare))}</p>
    <p style="margin:0 0 8px;"><strong>Deposit Due:</strong> ${escapeHtml(formatCurrency(depositDue))}</p>
    <p style="margin:0 0 12px;"><strong>Remaining Balance:</strong> ${escapeHtml(formatCurrency(remainingBalance))}</p>
    <p style="margin:0 0 16px;"><a href="${escapeHtml(paymentUrl)}" style="background:#d4af37;color:#000;padding:12px 20px;text-decoration:none;border-radius:999px;display:inline-block;font-weight:bold;">Pay Deposit</a></p>
    <p style="margin:0;">Your booking becomes secured once the deposit has been received.</p>
  `;

  await sendEmail({
    to,
    subject: "Your Arive booking has been accepted",
    html: renderEmailWrapper({ title: "Your Arive booking has been accepted", children: body }),
  });
}

export async function sendDepositReceivedEmail({
  to,
  fullName,
  pickup,
  destination,
  journeyDate,
  journeyTime,
  depositReceived,
  remainingBalance,
}: {
  to: string;
  fullName?: string | null;
  pickup?: string | null;
  destination?: string | null;
  journeyDate?: string | null;
  journeyTime?: string | null;
  depositReceived?: string | number | null;
  remainingBalance?: string | number | null;
}) {
  const body = `
    <p style="margin:0 0 12px;">Hi ${escapeHtml(fullName || "there")},</p>
    <p style="margin:0 0 12px;">We have received your deposit payment and your booking is now secured.</p>
    <p style="margin:0 0 8px;"><strong>Pickup:</strong> ${escapeHtml(pickup)}</p>
    <p style="margin:0 0 8px;"><strong>Destination:</strong> ${escapeHtml(destination)}</p>
    <p style="margin:0 0 8px;"><strong>Journey Date:</strong> ${escapeHtml(journeyDate)}</p>
    <p style="margin:0 0 8px;"><strong>Journey Time:</strong> ${escapeHtml(journeyTime)}</p>
    <p style="margin:0 0 8px;"><strong>Deposit Received:</strong> ${escapeHtml(formatCurrency(depositReceived))}</p>
    <p style="margin:0;"><strong>Remaining Balance:</strong> ${escapeHtml(formatCurrency(remainingBalance))}</p>
  `;

  await sendEmail({
    to,
    subject: "Your Arive booking is secured",
    html: renderEmailWrapper({ title: "Your Arive booking is secured", children: body }),
  });
}

export async function sendCancellationEmail({
  to,
  fullName,
  pickup,
  destination,
  journeyDate,
  journeyTime,
}: {
  to: string;
  fullName?: string | null;
  pickup?: string | null;
  destination?: string | null;
  journeyDate?: string | null;
  journeyTime?: string | null;
}) {
  const body = `
    <p style="margin:0 0 12px;">Hi ${escapeHtml(fullName || "there")},</p>
    <p style="margin:0 0 12px;">Your Arive booking has been cancelled. We are sorry for any inconvenience caused.</p>
    <p style="margin:0 0 8px;"><strong>Pickup:</strong> ${escapeHtml(pickup)}</p>
    <p style="margin:0 0 8px;"><strong>Destination:</strong> ${escapeHtml(destination)}</p>
    <p style="margin:0 0 8px;"><strong>Journey Date:</strong> ${escapeHtml(journeyDate)}</p>
    <p style="margin:0 0 12px;"><strong>Journey Time:</strong> ${escapeHtml(journeyTime)}</p>
    <p style="margin:0;">If this was unexpected, please contact Arive directly and we will be happy to help.</p>
  `;

  await sendEmail({
    to,
    subject: "Your Arive booking has been cancelled",
    html: renderEmailWrapper({ title: "Your Arive booking has been cancelled", children: body }),
  });
}

export async function sendJourneyCompletedEmail({
  to,
  fullName,
  pickup,
  destination,
  journeyDate,
  journeyTime,
  totalFare,
  reviewUrl,
}: {
  to: string;
  fullName?: string | null;
  pickup?: string | null;
  destination?: string | null;
  journeyDate?: string | null;
  journeyTime?: string | null;
  totalFare?: string | number | null;
  reviewUrl?: string | null;
}) {
  const body = `
    <p style="margin:0 0 12px;">Hi ${escapeHtml(fullName || "there")},</p>
    <p style="margin:0 0 12px;">Thank you for travelling with Arive. We hope your journey was smooth and comfortable.</p>
    <p style="margin:0 0 8px;"><strong>Pickup:</strong> ${escapeHtml(pickup)}</p>
    <p style="margin:0 0 8px;"><strong>Destination:</strong> ${escapeHtml(destination)}</p>
    <p style="margin:0 0 8px;"><strong>Journey Date:</strong> ${escapeHtml(journeyDate)}</p>
    <p style="margin:0 0 8px;"><strong>Journey Time:</strong> ${escapeHtml(journeyTime)}</p>
    <p style="margin:0 0 12px;"><strong>Total Fare:</strong> ${escapeHtml(formatCurrency(totalFare))}</p>
    <p style="margin:0;">We really appreciate your booking and would love your feedback.</p>
    ${reviewUrl ? `<p style="margin:16px 0 0;"><a href="${escapeHtml(reviewUrl)}" style="background:#d4af37;color:#000;padding:12px 20px;text-decoration:none;border-radius:999px;display:inline-block;font-weight:bold;">Leave a Review</a></p>` : ""}
  `;

  await sendEmail({
    to,
    subject: "Thank you for travelling with Arive",
    html: renderEmailWrapper({ title: "Thank you for travelling with Arive", children: body }),
  });
}
