import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn("RESEND_API_KEY is missing");
}

const resend = new Resend(resendApiKey || "missing_key");

export async function POST(req: Request) {
  try {
    const body = await req.json();

    await resend.emails.send({
      from: "Arive <onboarding@resend.dev>",
      to: ["adnanahmed.1988@googlemail.com"],
      subject: "New Booking Request",
      html: `
        <h2>New Booking Request</h2>
        <p><strong>Name:</strong> ${body.fullName}</p>
        <p><strong>Phone:</strong> ${body.phone}</p>
        <p><strong>Pickup:</strong> ${body.pickup}</p>
        <p><strong>Destination:</strong> ${body.destination}</p>
        <p><strong>Date:</strong> ${body.date}</p>
        <p><strong>Time:</strong> ${body.time}</p>
        <p><strong>Passengers:</strong> ${body.passengers}</p>
        <p><strong>Vehicle:</strong> ${body.vehicle}</p>
        <p><strong>Price:</strong> £${body.price}</p>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false }, { status: 500 });
  }
}