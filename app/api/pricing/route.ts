import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("pricing_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return Response.json(
      { success: false, error: error?.message || "Pricing settings not found" },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    pricing: {
      baseFare: Number(data.base_fare),
      pricePerMile: Number(data.price_per_mile),
      minimumFare: Number(data.minimum_fare),
      nightMultiplier: Number(data.night_multiplier),
      depositPercentage: Number(data.deposit_percentage),
    },
  });
}
