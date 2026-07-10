import { sendBookingRequestReceivedEmail } from "@/lib/email";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

const basePayload = {
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
};

const insertPayload = {
  ...basePayload,
  flight_number: body.flightNumber?.toString().trim() || null,
  meet_and_greet: Boolean(body.meetAndGreet),
  flight_tracking: Boolean(body.flightTracking),
};

const { error: dbError } = await supabase.from("bookings").insert([insertPayload]);

if (dbError) {
  const message = String(dbError.message || "");
  if (message.includes("column") && message.includes("does not exist")) {
    console.warn(
      "Supabase bookings table is missing flight-related columns. Create flight_number, meet_and_greet, and flight_tracking to store them."
    );

    const { error: fallbackError } = await supabase.from("bookings").insert([basePayload]);
    if (fallbackError) {
      console.error("Supabase fallback insert error:", fallbackError);
    }
  } else {
    console.error("Supabase error:", dbError);
  }
}


    try {
      await sendBookingRequestReceivedEmail({
        to: "arivegroupltd@outlook.com",
        fullName: body.fullName,
        pickup: body.pickup,
        destination: body.destination,
        journeyDate: body.date,
        journeyTime: body.time,
        passengers: body.passengers,
        vehicle: body.vehicle,
        flightNumber: body.flightNumber,
        meetAndGreet: body.meetAndGreet,
        totalFare: body.price,
      });
    } catch (emailError) {
      console.error("Customer booking receipt email failed:", emailError);
    }

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
${body.flightNumber ? `Flight Number: ${body.flightNumber}` : ""}
${body.meetAndGreet ? "Meet & Greet: Yes" : ""}
${body.flightTracking ? "Flight Tracking: Yes" : ""}
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