"use client";

export default function StatusButtons({ id }: { id: number }) {
  const updateStatus = async (status: string) => {
const confirmed = window.confirm(
  `Are you sure you want to mark this booking as ${status}?`
);

if (!confirmed) return;

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

const createDeposit = async (id: number) => {
  const confirmed = window.confirm(
    "Confirm this booking and send deposit payment link to customer?"
  );

  if (!confirmed) return;

  const response = await fetch("/api/stripe/deposit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  const result = await response.json();

  if (result.success) {
    window.location.reload();
  } else {
    alert(result.error || "Could not create deposit link.");
  }
};

  return (
    <div className="flex flex-col gap-2">
      <button onClick={() => createDeposit(id)}
	className="rounded-full bg-green-600 px-3 py-2 text-xs text-white">
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
