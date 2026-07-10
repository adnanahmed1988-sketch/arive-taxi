import { supabase } from "@/lib/supabase";

export type PricingSettings = {
  baseFare: number;
  pricePerMile: number;
  minimumFare: number;
  nightMultiplier: number;
  depositPercentage: number;
};

export async function getPricingSettings(): Promise<PricingSettings> {
  const { data, error } = await supabase
    .from("pricing_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Pricing settings not found");
  }

  return {
    baseFare: Number(data.base_fare),
    pricePerMile: Number(data.price_per_mile),
    minimumFare: Number(data.minimum_fare),
    nightMultiplier: Number(data.night_multiplier),
    depositPercentage: Number(data.deposit_percentage),
  };
}

export async function updatePricingSettings(values: PricingSettings) {
  const { error } = await supabase
    .from("pricing_settings")
    .update({
      base_fare: values.baseFare,
      price_per_mile: values.pricePerMile,
      minimum_fare: values.minimumFare,
      night_multiplier: values.nightMultiplier,
      deposit_percentage: values.depositPercentage,
    })
    .eq("id", 1);

  if (error) {
    throw new Error(error.message || "Failed to update pricing settings.");
  }
}
