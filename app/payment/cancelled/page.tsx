import Link from "next/link";

export default function PaymentCancelledPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-[#F2DFBC]">
      <section className="w-full max-w-xl rounded-[2rem] border border-[#D4AF37]/25 bg-[#080808] p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-3xl text-red-400">
          ×
        </div>

        <p className="mt-6 text-xs uppercase tracking-[0.35em] text-[#D4AF37]">
          Payment not completed
        </p>

        <h1 className="mt-4 text-3xl font-semibold">
          Your deposit has not been paid
        </h1>

        <p className="mt-4 leading-7 text-[#bba987]">
          No payment has been taken. You can return to the secure payment link
          in your email when you are ready.
        </p>

        <p className="mt-4 text-sm text-[#8f7a56]">
          Your booking will remain awaiting deposit until payment is received.
        </p>

        <Link
          href="/"
          className="mt-8 inline-block rounded-full border border-[#D4AF37]/40 px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#D4AF37]"
        >
          Return to Arive
        </Link>
      </section>
    </main>
  );
}
