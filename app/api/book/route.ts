import { supabase } from "@/lib/supabase";


import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn("RESEND_API_KEY is missing");
}

const resend = new Resend(resendApiKey || "missing_key");

export async function POST(req: Request) {
  try {
    const body = await req.json();

const { error: dbError } = await supabase.from("bookings").insert([
  {
    full_name: body.fullName,
    phone: body.phone,
    email: body.email,
    pickup: body.pickup,
    destination: body.destination,
    journey_date: body.date,
    journey_time: body.time,
    passengers: body.passengers,
    vehicle: body.vehicle,
    price: body.price,
    status: "New",
  },
]);

if (dbError) {
  console.error("Supabase error:", dbError);
}


    await resend.emails.send({
      from: "Arive <onboarding@resend.dev>",
      to: ["adnanahmed.1988@googlemail.com"],
      subject: "New Booking Request",
      html: `
        <h2>New Booking Request</h2>
        <p><strong>Name:</strong> ${body.fullName}</p>
        <p><strong>Phone:</strong> ${body.phone}</p>
	<p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Pickup:</strong> ${body.pickup}</p>
        <p><strong>Destination:</strong> ${body.destination}</p>
        <p><strong>Date:</strong> ${body.date}</p>
        <p><strong>Time:</strong> ${body.time}</p>
        <p><strong>Passengers:</strong> ${body.passengers}</p>
        <p><strong>Vehicle:</strong> ${body.vehicle}</p>
        <p><strong>Price:</strong> £${body.price}</p>
      `,
    });

const whatsappMessage = `
NEW BOOKING REQUEST

Name: ${body.fullName}
Phone: ${body.phone}
Email: ${body.email}
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