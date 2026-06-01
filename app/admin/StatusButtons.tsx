"use client";

export default function StatusButtons({ id }: { id: number }) {
  const updateStatus = async (status: string) => {
    const response = await fetch("/api/bookings/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    });

    if (response.ok) {
      window.location.reload();
    } else {
      alert("Could not update booking.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button onClick={() => updateStatus("Confirmed")} className="rounded-full bg-green-600 px-3 py-2 text-xs text-white">
        Confirm
      </button>
      <button onClick={() => updateStatus("Completed")} className="rounded-full bg-blue-600 px-3 py-2 text-xs text-white">
        Complete
      </button>
      <button onClick={() => updateStatus("Cancelled")} className="rounded-full bg-red-600 px-3 py-2 text-xs text-white">
        Cancel
      </button>
    </div>
  );
}
