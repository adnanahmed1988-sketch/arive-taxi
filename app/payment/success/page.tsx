import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-[#F2DFBC]">
      <section className="w-full max-w-xl rounded-[2rem] border border-[#D4AF37]/25 bg-[#080808] p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-3xl text-green-400">
          ✓
        </div>

        <p className="mt-6 text-xs uppercase tracking-[0.35em] text-[#D4AF37]">
          Payment successful
        </p>

        <h1 className="mt-4 text-3xl font-semibold">
          Your booking is secured
        </h1>

        <p className="mt-4 leading-7 text-[#bba987]">
          Thank you. We have received your deposit and your Arive Executive
          Travel booking is now confirmed.
        </p>

        <p className="mt-4 text-sm text-[#8f7a56]">
          Please keep an eye on your email for your booking confirmation and
          journey details.
        </p>

        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-[#D4AF37] px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black"
        >
          Return to Arive
        </Link>
      </section>
    </main>
  );
}
