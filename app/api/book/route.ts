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

if (body.email) {
  await resend.emails.send({
    from: "Arive <onboarding@resend.dev>",
    to: [body.email],
    subject: "We've received your booking request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>Thank you for choosing Arive Executive Travel</h2>

        <p>Hi ${body.fullName},</p>

        <p>We've received your booking request and will confirm it shortly.</p>

        <h3>Journey Details</h3>

        <p><strong>Pickup:</strong> ${body.pickup}</p>
        <p><strong>Destination:</strong> ${body.destination}</p>
        <p><strong>Date:</strong> ${body.date}</p>
        <p><strong>Time:</strong> ${body.time}</p>
        <p><strong>Passengers:</strong> ${body.passengers}</p>
        <p><strong>Estimated Fare:</strong> £${body.price}</p>

        <hr />

        <p>
          Please note this is a booking request and is not confirmed until
          you receive confirmation from Arive.
        </p>

        <p>
          Arive Executive Travel<br/>
          Suffolk, United Kingdom
        </p>
      </div>
    `,
  });
}

    const whatsappMessage = `
NEW BOOKING REQUEST

Name: ${body.fullName}
Phone: ${body.phone}
Pickup: ${body.pickup}
Destination: ${body.destination}
Date: ${body.date}
Time: ${body.time}
Passengers: ${body.passengers}
Vehicle: ${body.vehicle}
Price: £${body.price}
`;

return Response.json({
  success: true,
  whatsappUrl: `https://wa.me/447714700899?text=${encodeURIComponent(
    whatsappMessage
  )}`,
});
  } catch (error) {
    console.error(error);
    return Response.json({ success: false }, { status: 500 });
  }
}