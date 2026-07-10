import { supabase } from "@/lib/supabase";
import Stripe from "stripe";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "missing_key");
const resend = new Resend(process.env.RESEND_API_KEY || "missing_key");

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

    const totalPrice = Number(booking.price || 0);
    const depositAmount = Math.max(Math.round(totalPrice * 0.2 * 100), 2000);
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
        await resend.emails.send({
          from: "Arive <onboarding@resend.dev>",
          to: [booking.email],
          subject: "Your Arive booking deposit request",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2>Booking Accepted</h2>
              <p>Hi ${booking.full_name},</p>
              <p>Your booking with Arive Executive Travel has been accepted. Please pay your deposit using the secure link below.</p>

              <h3>Journey Details</h3>
              <p><strong>Pickup:</strong> ${booking.pickup}</p>
              <p><strong>Destination:</strong> ${booking.destination}</p>
              <p><strong>Date:</strong> ${booking.journey_date}</p>
              <p><strong>Time:</strong> ${booking.journey_time}</p>
              <p><strong>Total Fare:</strong> £${totalPrice.toFixed(2)}</p>
              <p><strong>Deposit Due:</strong> £${depositPounds.toFixed(2)}</p>
              <p><strong>Balance Remaining:</strong> £${balance.toFixed(2)}</p>

              <p>
                <a href="${session.url}" style="background:#000;color:#fff;padding:14px 22px;text-decoration:none;border-radius:8px;display:inline-block;">
                  Pay Deposit
                </a>
              </p>

              <p>Your booking is secured once the deposit has been received.</p>
              <p>Thank you for choosing Arive Executive Travel.</p>
            </div>
          `,
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

