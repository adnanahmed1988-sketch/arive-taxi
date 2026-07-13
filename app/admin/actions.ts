"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendDriverAssignedEmail } from "@/lib/email";
import { supabase } from "@/lib/supabase";

function readString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDriverPayload(formData: FormData) {
  const name = readString(formData.get("name"));
  const email = readString(formData.get("email"));
  const phone = readString(formData.get("phone"));
  const vehicleMake = readString(formData.get("vehicleMake"));
  const vehicleModel = readString(formData.get("vehicleModel"));
  const vehicleRegistration = readString(formData.get("vehicleRegistration"));
  const vehicleColour = readString(formData.get("vehicleColour"));
  const notes = readString(formData.get("notes"));
  const active = readString(formData.get("active")) === "true";

  if (!name) {
    throw new Error("Driver name is required.");
  }

  return {
    name,
    email: email || null,
    phone: phone || null,
    vehicle_make: vehicleMake || null,
    vehicle_model: vehicleModel || null,
    vehicle_registration: vehicleRegistration || null,
    vehicle_colour: vehicleColour || null,
    notes: notes || null,
    active,
  };
}

export async function createOrUpdateDriver(formData: FormData) {
  try {
    const driverId = readString(formData.get("id"));
    const payload = normalizeDriverPayload(formData);

    if (driverId) {
      const { error } = await supabase
        .from("drivers")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", driverId);

      if (error) {
        throw error;
      }
    } else {
      const { error } = await supabase.from("drivers").insert([
        {
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        throw error;
      }
    }
  } catch (error) {
    console.error("Driver save failed", error);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/drivers");
  redirect("/admin/drivers");
}

export async function toggleDriverStatus(formData: FormData) {
  const driverId = readString(formData.get("id"));
  const currentActive = readString(formData.get("active")) === "true";

  if (!driverId) {
    redirect("/admin/drivers");
  }

  const { error } = await supabase
    .from("drivers")
    .update({
      active: !currentActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", driverId);

  if (error) {
    console.error("Driver status update failed", error);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/drivers");
  redirect("/admin/drivers");
}

export async function deleteDriver(formData: FormData) {
  const driverId = readString(formData.get("id"));

  if (!driverId) {
    redirect("/admin/drivers");
  }

  const { data: assignedBookings, error: lookupError } = await supabase
    .from("bookings")
    .select("id")
    .eq("driver_id", driverId);

  if (lookupError) {
    console.error("Failed to check driver bookings", lookupError);
  }

  if ((assignedBookings ?? []).length > 0) {
    revalidatePath("/admin");
    revalidatePath("/admin/drivers");
    redirect("/admin/drivers?error=Driver+still+has+assigned+bookings");
  }

  const { error } = await supabase.from("drivers").delete().eq("id", driverId);

  if (error) {
    console.error("Driver deletion failed", error);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/drivers");
  redirect("/admin/drivers");
}

export async function assignDriverAction(formData: FormData) {
  const bookingId = readString(formData.get("bookingId"));
  const driverId = readString(formData.get("driverId"));
  const action = readString(formData.get("action"));

  if (!bookingId) {
    redirect("/admin");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, email, full_name, journey_date, journey_time, pickup, destination, driver_accepted_at")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    console.error("Failed to load booking for driver assignment", bookingError);
    redirect("/admin");
  }

  const updatePayload = {
    driver_id: action === "assign" && driverId ? driverId : null,
    driver_status: action === "assign" && driverId ? "Assigned" : "Unassigned",
    driver_assigned_at: action === "assign" && driverId ? new Date().toISOString() : null,
    driver_accepted_at: action === "assign" && driverId ? booking.driver_accepted_at ?? null : null,
  };

  const { error: updateError } = await supabase
    .from("bookings")
    .update(updatePayload)
    .eq("id", bookingId);

  if (updateError) {
    console.error("Driver assignment update failed", updateError);
  }

  if (action === "assign" && driverId) {
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id, name, phone, vehicle_make, vehicle_model, vehicle_registration")
      .eq("id", driverId)
      .eq("active", true)
      .single();

    if (!driverError && driver && booking.email) {
      const usefulDriverDetails = Boolean(driver.name && (driver.phone || driver.vehicle_make || driver.vehicle_model || driver.vehicle_registration));
      if (usefulDriverDetails) {
        try {
          console.log("CUSTOMER EMAIL RECIPIENT", booking.email);
          await sendDriverAssignedEmail({
            to: booking.email,
            fullName: booking.full_name,
            journeyDate: booking.journey_date,
            journeyTime: booking.journey_time,
            pickup: booking.pickup,
            destination: booking.destination,
            driverName: driver.name,
            vehicleMake: driver.vehicle_make,
            vehicleModel: driver.vehicle_model,
            vehicleRegistration: driver.vehicle_registration,
            driverPhone: driver.phone,
          });
        } catch (emailError) {
          console.error("Driver assignment email failed", emailError);
        }
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/drivers");
  redirect("/admin");
}
