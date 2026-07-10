import { getPricingSettings } from "@/lib/pricing";
import { sendDepositRequestedEmail } from "@/lib/email";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "missing_key");

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !booking) {
      return Response.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    const pricingSettings = await getPricingSettings();
    const totalPrice = Number(booking.price || 0);
    const depositAmount = Math.max(
      Math.round(totalPrice * (pricingSettings.depositPercentage / 100) * 100),
      2000
    );
    const depositPounds = depositAmount / 100;
    const balance = Math.max(totalPrice - depositPounds, 0);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: booking.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Arive Deposit - Booking #${booking.id}`,
              description: `${booking.pickup} to ${booking.destination}`,
            },
            unit_amount: depositAmount,
          },
          quantity: 1,
        },
      ],
success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancelled`,
      metadata: {
        booking_id: String(booking.id),
      },
    });

    await supabase
      .from("bookings")
      .update({
        status: "Awaiting Deposit",
        deposit_amount: depositPounds,
        payment_status: "Awaiting",
        payment_link: session.url,
        stripe_session_id: session.id,
      })
      .eq("id", id);

    if (booking.email && session.url) {
      try {
        await sendDepositRequestedEmail({
          to: booking.email,
          fullName: booking.full_name,
          pickup: booking.pickup,
          destination: booking.destination,
          journeyDate: booking.journey_date,
          journeyTime: booking.journey_time,
          vehicle: booking.vehicle,
          flightNumber: booking.flight_number,
          totalFare: totalPrice,
          depositDue: depositPounds,
          remainingBalance: balance,
          paymentUrl: session.url,
        });
      } catch (emailError) {
        console.error("Deposit email failed:", emailError);
      }
    }

    return Response.json({ success: true, url: session.url });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: "Could not create deposit payment" }, { status: 500 });
  }
}

