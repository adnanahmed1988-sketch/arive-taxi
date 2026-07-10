import { sendCancellationEmail, sendJourneyCompletedEmail } from "@/lib/email";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { id, status } = await req.json();

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !booking) {
      return Response.json({ success: false, error: fetchError?.message || "Booking not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    if (status === "Cancelled" && booking.email) {
      try {
        await sendCancellationEmail({
          to: booking.email,
          fullName: booking.full_name,
          pickup: booking.pickup,
          destination: booking.destination,
          journeyDate: booking.journey_date,
          journeyTime: booking.journey_time,
        });
      } catch (emailError) {
        console.error("Cancellation email failed:", emailError);
      }
    }

    if (status === "Completed" && booking.email) {
      try {
        const reviewUrl = process.env.GOOGLE_REVIEW_URL?.trim();
        await sendJourneyCompletedEmail({
          to: booking.email,
          fullName: booking.full_name,
          pickup: booking.pickup,
          destination: booking.destination,
          journeyDate: booking.journey_date,
          journeyTime: booking.journey_time,
          totalFare: booking.price,
          reviewUrl,
        });
      } catch (emailError) {
        console.error("Completion email failed:", emailError);
      }
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false, error: "Failed to update booking" }, { status: 500 });
  }
}
