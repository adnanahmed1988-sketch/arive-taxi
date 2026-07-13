import { sendBookingReceivedEmail } from "@/lib/email";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

const passengerCount = body.passengers ?? body.passengerCount ?? body.numberOfPassengers ?? body.passenger_count ?? "";

const basePayload = {
  full_name: body.fullName,
  phone: body.phone,
  email: body.email,
  pickup: body.pickup,
  destination: body.destination,
  journey_date: body.date,
  journey_time: body.time,
  passengers: passengerCount,
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
  console.error("Supabase error:", JSON.stringify(dbError, null, 2));
  console.error("Supabase error details", {
    code: dbError.code ?? null,
    message: dbError.message ?? null,
    details: dbError.details ?? null,
    hint: dbError.hint ?? null,
  });

  const message = String(dbError.message || "");
  const missingColumnMatch = message.match(/Could not find the '([^']+)' column/i);
  const isMissingColumnError = message.includes("column") && message.includes("does not exist") || Boolean(missingColumnMatch);

  if (isMissingColumnError) {
    const missingColumnName = missingColumnMatch?.[1] ?? "one of the flight-related columns";
    console.warn(
      `Supabase bookings table is missing ${missingColumnName}. Retrying the insert without flight-related columns.`
    );

    const { error: fallbackError } = await supabase.from("bookings").insert([basePayload]);
    if (fallbackError) {
      console.error("Supabase fallback insert error:", JSON.stringify(fallbackError, null, 2));
      console.error("Supabase fallback insert error details", {
        code: fallbackError.code ?? null,
        message: fallbackError.message ?? null,
        details: fallbackError.details ?? null,
        hint: fallbackError.hint ?? null,
      });
      return Response.json({ success: false, error: fallbackError.message || "Supabase insert failed" }, { status: 500 });
    }
  } else {
    return Response.json({ success: false, error: dbError.message || "Supabase insert failed" }, { status: 500 });
  }
}

    console.log("BOOKING CREATED");

    try {
      console.log("CUSTOMER EMAIL RECIPIENT", body.email);
      console.log("CALLING BOOKING EMAIL");
      const emailResult = await sendBookingReceivedEmail({
        to: body.email,
        fullName: body.fullName,
        pickup: body.pickup,
        destination: body.destination,
        journeyDate: body.date,
        journeyTime: body.time,
        passengers: passengerCount,
        vehicle: body.vehicle,
        flightNumber: body.flightNumber,
        meetAndGreet: body.meetAndGreet,
        totalFare: body.price,
      });
      console.log("BOOKING EMAIL RESULT", JSON.stringify(emailResult));
    } catch (emailError) {
      console.error("BOOKING EMAIL FAILED", emailError);
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