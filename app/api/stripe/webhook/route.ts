import Stripe from "stripe";
import { headers } from "next/headers";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature failed:", error);
    return new Response("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = Number(session.metadata?.booking_id);

    if (!bookingId) {
      console.error("Missing booking_id in Stripe metadata");
      return new Response("Missing booking ID", { status: 400 });
    }

    const { error } = await supabase
      .from("bookings")
      .update({
        payment_status: "Paid",
        status: "Deposit Paid",
        deposit_paid_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (error) {
      console.error("Supabase webhook update failed:", error);
      return new Response("Database update failed", { status: 500 });
    }
  }

  return Response.json({ received: true });
}
