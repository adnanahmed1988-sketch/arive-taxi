import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { id, status } = await req.json();

    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { success: false, error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
