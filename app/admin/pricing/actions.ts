"use server";

import { revalidatePath } from "next/cache";
import { updatePricingSettings } from "@/lib/pricing";

export type PricingFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

function parseNumber(value: FormDataEntryValue | null, fieldName: string): { value: number } | { error: string } {
  if (typeof value !== "string") {
    return { error: `${fieldName} is required.` };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { error: `${fieldName} is required.` };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { error: `${fieldName} must be a valid number.` };
  }

  return { value: parsed };
}

export async function savePricingSettings(
  _prevState: PricingFormState | undefined,
  formData: FormData
): Promise<PricingFormState> {
  const values = {
    baseFare: formData.get("baseFare"),
    pricePerMile: formData.get("pricePerMile"),
    minimumFare: formData.get("minimumFare"),
    nightMultiplier: formData.get("nightMultiplier"),
    depositPercentage: formData.get("depositPercentage"),
  };

  const errors: Record<string, string> = {};

  const baseFareResult = parseNumber(values.baseFare, "Base fare");
  if ("error" in baseFareResult) {
    errors.baseFare = baseFareResult.error;
  }

  const pricePerMileResult = parseNumber(values.pricePerMile, "Price per mile");
  if ("error" in pricePerMileResult) {
    errors.pricePerMile = pricePerMileResult.error;
  }

  const minimumFareResult = parseNumber(values.minimumFare, "Minimum fare");
  if ("error" in minimumFareResult) {
    errors.minimumFare = minimumFareResult.error;
  }

  const nightMultiplierResult = parseNumber(values.nightMultiplier, "Night multiplier");
  if ("error" in nightMultiplierResult) {
    errors.nightMultiplier = nightMultiplierResult.error;
  }

  const depositPercentageResult = parseNumber(values.depositPercentage, "Deposit percentage");
  if ("error" in depositPercentageResult) {
    errors.depositPercentage = depositPercentageResult.error;
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
      values: Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, typeof value === "string" ? value : ""])
      ),
    };
  }

  const baseFare = "error" in baseFareResult ? 0 : baseFareResult.value;
  const pricePerMile = "error" in pricePerMileResult ? 0 : pricePerMileResult.value;
  const minimumFare = "error" in minimumFareResult ? 0 : minimumFareResult.value;
  const nightMultiplier = "error" in nightMultiplierResult ? 0 : nightMultiplierResult.value;
  const depositPercentage = "error" in depositPercentageResult ? 0 : depositPercentageResult.value;

  if (
    baseFare <= 0 ||
    pricePerMile <= 0 ||
    minimumFare <= 0 ||
    nightMultiplier <= 0 ||
    depositPercentage <= 0 ||
    depositPercentage > 100
  ) {
    return {
      success: false,
      errors: {
        baseFare: baseFare <= 0 ? "Base fare must be greater than 0." : "",
        pricePerMile: pricePerMile <= 0 ? "Price per mile must be greater than 0." : "",
        minimumFare: minimumFare <= 0 ? "Minimum fare must be greater than 0." : "",
        nightMultiplier: nightMultiplier <= 0 ? "Night multiplier must be greater than 0." : "",
        depositPercentage:
          depositPercentage <= 0
            ? "Deposit percentage must be greater than 0."
            : depositPercentage > 100
              ? "Deposit percentage cannot exceed 100."
              : "",
      },
      values: Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, typeof value === "string" ? value : ""])
      ),
    };
  }

  try {
    await updatePricingSettings({
      baseFare,
      pricePerMile,
      minimumFare,
      nightMultiplier,
      depositPercentage,
    });

    revalidatePath("/admin/pricing");

    return {
      success: true,
      message: "Pricing settings saved successfully.",
      values: {
        baseFare: String(baseFare),
        pricePerMile: String(pricePerMile),
        minimumFare: String(minimumFare),
        nightMultiplier: String(nightMultiplier),
        depositPercentage: String(depositPercentage),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to save pricing settings.",
      values: Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, typeof value === "string" ? value : ""])
      ),
    };
  }
}
