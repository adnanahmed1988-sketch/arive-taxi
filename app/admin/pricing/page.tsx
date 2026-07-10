import { getPricingSettings } from "@/lib/pricing";
import PricingForm from "./PricingForm";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const pricing = await getPricingSettings();

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-[#F2DFBC] sm:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#090909] p-6 shadow-[0_0_40px_rgba(212,175,55,0.08)] sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">
                Arive Admin
              </p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
                Pricing Settings
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-[#8f7a56] sm:text-base">
                Update the pricing rules used for bookings, deposits, and night-time journeys.
              </p>
            </div>
          </div>

          <PricingForm initialValues={pricing} />
        </div>
      </div>
    </main>
  );
}