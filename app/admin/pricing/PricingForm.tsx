"use client";

import { useActionState, useEffect, type FormEvent } from "react";
import { savePricingSettings, type PricingFormState } from "./actions";

const initialState: PricingFormState = {
  success: false,
};

type PricingFormProps = {
  initialValues: {
    baseFare: number;
    pricePerMile: number;
    minimumFare: number;
    nightMultiplier: number;
    depositPercentage: number;
  };
};

const fieldLabels: Record<string, string> = {
  baseFare: "Base Fare",
  pricePerMile: "Price Per Mile",
  minimumFare: "Minimum Fare",
  nightMultiplier: "Night Multiplier",
  depositPercentage: "Deposit Percentage",
};

export default function PricingForm({ initialValues }: PricingFormProps) {
  const [state, formAction, pending] = useActionState(savePricingSettings, initialState);

  useEffect(() => {
    if (state?.success && state.values) {
      const form = document.getElementById("pricing-form") as HTMLFormElement | null;
      if (form) {
        const formData = new FormData(form);
        for (const [key, value] of Object.entries(state.values)) {
          const input = form.elements.namedItem(key) as HTMLInputElement | null;
          if (input) {
            input.value = value;
          }
        }
        formData.set("baseFare", state.values.baseFare ?? "");
        formData.set("pricePerMile", state.values.pricePerMile ?? "");
        formData.set("minimumFare", state.values.minimumFare ?? "");
        formData.set("nightMultiplier", state.values.nightMultiplier ?? "");
        formData.set("depositPercentage", state.values.depositPercentage ?? "");
      }
    }
  }, [state]);

  return (
    <form id="pricing-form" action={formAction} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { key: "baseFare", prefix: "£", step: "0.01" },
          { key: "pricePerMile", prefix: "£", step: "0.01" },
          { key: "minimumFare", prefix: "£", step: "0.01" },
          { key: "nightMultiplier", prefix: "", step: "0.1" },
          { key: "depositPercentage", prefix: "", step: "1" },
        ].map((field) => {
          const value = state?.values?.[field.key] ?? String(initialValues[field.key as keyof typeof initialValues]);
          const error = state?.errors?.[field.key];
          return (
            <label key={field.key} className="flex flex-col gap-2 rounded-2xl border border-[#D4AF37]/15 bg-white/[0.03] p-4">
              <span className="text-sm font-medium text-[#D4AF37]">{fieldLabels[field.key]}</span>
              <div className="flex items-center gap-2 rounded-xl border border-[#D4AF37]/20 bg-black px-3 py-3">
                {field.prefix ? <span className="text-[#8f7a56]">{field.prefix}</span> : null}
                <input
                  id={field.key}
                  name={field.key}
                  type="number"
                  step={field.step}
                  min={field.key === "depositPercentage" ? "0" : "0.01"}
                  max={field.key === "depositPercentage" ? "100" : undefined}
                  defaultValue={value}
                  className="w-full bg-transparent text-lg text-[#F2DFBC] outline-none"
                />
                {field.key === "nightMultiplier" ? <span className="text-[#8f7a56]">x</span> : null}
                {field.key === "depositPercentage" ? <span className="text-[#8f7a56]">%</span> : null}
              </div>
              {error ? <span className="text-sm text-red-400">{error}</span> : null}
            </label>
          );
        })}
      </div>

      {state?.message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.success
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[#D4AF37] px-6 py-3 text-base font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#e6c45c] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save Pricing"}
      </button>
    </form>
  );
}
