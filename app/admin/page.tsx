import { supabase } from "@/lib/supabase";
import StatusButtons from "./StatusButtons";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-black p-8 text-[#F2DFBC]">
      <h1 className="mb-8 text-4xl font-bold">
        Arive Bookings Dashboard
      </h1>

<div className="grid gap-4 md:hidden">
  {bookings?.map((booking) => {
    const phoneNumber = booking.phone.replace(/^0/, "44").replace(/\s+/g, "");
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      booking.pickup
    )}&destination=${encodeURIComponent(booking.destination)}&travelmode=driving`;

    const whatsappMessage = encodeURIComponent(
      `Hello ${booking.full_name}, this is Arive Executive Travel. Your booking from ${booking.pickup} to ${booking.destination} on ${booking.journey_date} at ${booking.journey_time} is being reviewed.`
    );

    return (
      <div
        key={booking.id}
        className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-[#080808] p-5 shadow-[0_0_40px_rgba(212,175,55,0.08)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#D4AF37]">
            {booking.status}
          </span>
          <span className="text-xl font-semibold">£{booking.price}</span>
        </div>

        <h2 className="text-2xl font-semibold">{booking.full_name}</h2>
        <p className="mt-1 text-sm text-[#8f7a56]">{booking.phone}</p>

        <div className="mt-4 rounded-2xl bg-white/[0.03] p-4 text-sm leading-6">
          <p className="text-[#8f7a56]">Pickup</p>
          <p>{booking.pickup}</p>

          <p className="my-2 text-[#D4AF37]">↓</p>

          <p className="text-[#8f7a56]">Destination</p>
          <p>{booking.destination}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/[0.03] p-3">
            <p className="text-[#8f7a56]">Date</p>
            <p>{booking.journey_date}</p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] p-3">
            <p className="text-[#8f7a56]">Time</p>
            <p>{booking.journey_time}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <a
            href={`tel:${booking.phone}`}
            className="rounded-full bg-[#D4AF37] px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-black"
          >
            Call
          </a>

          <a
            href={`https://wa.me/${phoneNumber}?text=${whatsappMessage}`}
            target="_blank"
            className="rounded-full border border-[#D4AF37]/30 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]"
          >
            WhatsApp
          </a>

          <a
            href={mapsUrl}
            target="_blank"
            className="rounded-full border border-[#D4AF37]/30 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]"
          >
            Navigate
          </a>
        </div>

        <div className="mt-5">
          <StatusButtons id={booking.id} />
        </div>
      </div>
    );
  })}
</div>

     <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-[#D4AF37]/20 md:block">
        <table className="w-full text-left">
          <thead className="bg-[#111]">
            <tr>
              <th className="p-4">Status</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Date</th>
              <th className="p-4">Time</th>
              <th className="p-4">Journey</th>
              <th className="p-4">Price</th>
		<th className="p-4">Actions</th>
		<th className="p-4">Manage</th>
            </tr>
          </thead>

        <tbody>
  {bookings?.map((booking) => {
    const whatsappMessage = encodeURIComponent(
      `Hello ${booking.full_name}, this is Arive Executive Travel. We have received your booking request from ${booking.pickup} to ${booking.destination} on ${booking.journey_date} at ${booking.journey_time}. We will confirm availability shortly.`
    );

    return (
      <tr
        key={booking.id}
        className="border-t border-[#D4AF37]/10 align-top"
      >
        <td className="p-4">
          <span
            className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${
              booking.status === "Confirmed"
                ? "bg-green-500/10 text-green-400"
                : booking.status === "Cancelled"
                ? "bg-red-500/10 text-red-400"
                : booking.status === "Completed"
                ? "bg-blue-500/10 text-blue-400"
                : "bg-[#D4AF37]/10 text-[#D4AF37]"
            }`}
          >
            {booking.status}
          </span>
        </td>

        <td className="p-4">{booking.full_name}</td>
        <td className="p-4">{booking.phone}</td>
        <td className="p-4">{booking.journey_date}</td>
        <td className="p-4">{booking.journey_time}</td>

        <td className="max-w-[320px] p-4 text-sm leading-6">
          {booking.pickup}
          <br />
          <span className="text-[#D4AF37]">↓</span>
          <br />
          {booking.destination}
        </td>

      <td className="p-4">£{booking.price}</td>

<td className="p-4">
  <a
    href={`https://wa.me/${booking.phone.replace(/^0/, "44").replace(/\s+/g, "")}?text=${whatsappMessage}`}
    target="_blank"
    className="rounded-full border border-[#D4AF37]/30 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
  >
    WhatsApp
  </a>
</td>

<td className="p-4">
  <StatusButtons id={booking.id} />
</td>
      </tr>
    );
  })}
</tbody>
        </table>
      </div>
    </main>
  );
}