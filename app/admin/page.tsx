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

      <div className="overflow-x-auto rounded-2xl border border-[#D4AF37]/20">
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