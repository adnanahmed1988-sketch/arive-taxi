"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    __ARIVE_GOOGLE_MAPS_API_KEY__?: string;
    google?: any;
  }
}

const SERVICES = [
  {
    title: "Airport Transfers",
    text: "Reliable executive pickups and drop-offs with live flight tracking and punctual arrivals.",
  },
  {
    title: "Business Travel",
    text: "Professional transport for meetings, corporate accounts, and day-to-day executive travel.",
  },
  {
    title: "Private Hire",
    text: "Luxury journeys for evenings out, special occasions, and pre-booked local or long-distance trips.",
  },
];

const FEATURES = [
  "24/7 pre-booked service",
  "Professional, courteous drivers",
  "Luxury comfort and clean vehicles",
  "Airport, business, and private hire",
];

const VEHICLE_OPTIONS = [
  { name: "Executive", multiplier: 1, note: "Premium everyday travel" },
  { name: "Executive XL", multiplier: 1.35, note: "Extra room for groups and luggage" },
  { name: "First Class", multiplier: 1.65, note: "Top-tier luxury experience" },
];

const EXTRAS = [
  { key: "meetAndGreet", label: "Airport meet & greet", price: 8 },
  { key: "childSeat", label: "Child seat", price: 5 },
  { key: "waitingTime", label: "15 mins extra waiting", price: 6 },
  { key: "returnJourney", label: "Return journey", price: 0 },
] as const;

const GOOGLE_MAPS_API_KEY = "AIzaSyAD5CnDRx6eT5Dss8Yqe8MVfg87BcqYpD8";
const SANDBOX_HOSTS = ["web-sandbox.oaiusercontent.com", "localhost", "127.0.0.1"];

function getGoogleMapsApiKey() {
  if (
    typeof window !== "undefined" &&
    typeof window.__ARIVE_GOOGLE_MAPS_API_KEY__ === "string" &&
    window.__ARIVE_GOOGLE_MAPS_API_KEY__.trim()
  ) {
    return window.__ARIVE_GOOGLE_MAPS_API_KEY__.trim();
  }

  if (
    typeof process !== "undefined" &&
    typeof process.env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === "string" &&
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.trim()
  ) {
    return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.trim();
  }

if (typeof GOOGLE_MAPS_API_KEY === "string" && GOOGLE_MAPS_API_KEY.trim()) {
  return GOOGLE_MAPS_API_KEY.trim();
}

  return "";
}

function isSandboxHost() {
  if (typeof window === "undefined") return false;
  return SANDBOX_HOSTS.includes(window.location.hostname);
}

function formatCurrency(value: number) {
  return `£${value.toFixed(2)}`;
}
export default function AriveTaxiWebsite() {
  const pickupInputRef = useRef<HTMLInputElement | null>(null);
const destinationInputRef = useRef<HTMLInputElement | null>(null);
  const lastRouteKeyRef = useRef("");

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsEnabled, setMapsEnabled] = useState(false);
  const [distanceText, setDistanceText] = useState("");
  const [durationText, setDurationText] = useState("");
  const [fareError, setFareError] = useState("");
  const [hostNotice, setHostNotice] = useState("");
const [pickupConfirmed, setPickupConfirmed] = useState("");
const [destinationConfirmed, setDestinationConfirmed] = useState("");

  const [bookingData, setBookingData] = useState({
    fullName: "",
    phone: "",
    email: "",
    pickup: "",
    destination: "",
    date: "",
    time: "",
    passengers: "",
    miles: "",
    manualMiles: "",
    distanceMeters: 0,
    journeyType: "Airport transfer",
    vehicle: "Executive",
    notes: "",
    meetAndGreet: false,
    childSeat: false,
    waitingTime: false,
    returnJourney: false,
  });

 const handleChange = (key: keyof typeof bookingData, value: string | number | boolean) => {
  setBookingData((prev) => ({ ...prev, [key]: value }));
};
  const activeMiles = useMemo(() => {
    const source = mapsEnabled ? bookingData.miles : bookingData.manualMiles;
    const parsed = Number.parseFloat(source || "0");
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [bookingData.manualMiles, bookingData.miles, mapsEnabled]);

  const pricing = useMemo(() => {
    const baseFare = 7;
    const distanceFare = activeMiles > 0 ? activeMiles * 2 : 0;
    const selectedVehicle =
      VEHICLE_OPTIONS.find((option) => option.name === bookingData.vehicle) || VEHICLE_OPTIONS[0];

   const extrasTotal = EXTRAS.reduce((sum, extra) => {
  const selected = bookingData[extra.key as keyof typeof bookingData];
  if (!selected) return sum;
  if (extra.key === "returnJourney") return sum;
  return sum + extra.price;
}, 0);
    let total = (baseFare + distanceFare + extrasTotal) * selectedVehicle.multiplier;
    if (bookingData.returnJourney) total *= 2;

    return {
      baseFare,
      distanceFare,
      extrasTotal,
      vehicleMultiplier: selectedVehicle.multiplier,
      total,
      selectedVehicle,
    };
  }, [activeMiles, bookingData]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    if (isSandboxHost()) {
      setMapsEnabled(false);
      setMapsLoaded(false);
      setHostNotice(
        "Google Maps is turned off in this preview because the API key is not authorised for this sandbox domain. The fare calculator will use manual miles here, and live address lookup will work once the site is deployed on your authorised domain."
      );
      return undefined;
    }

    const existingScript = document.querySelector('script[data-google-maps="true"]');

    const markLoaded = () => {
      if (window.google?.maps?.places) {
        setMapsLoaded(true);
        setMapsEnabled(true);
        setFareError("");
        setHostNotice("");
      }
    };

    if (existingScript) {
      if (window.google?.maps?.places) {
        setMapsLoaded(true);
        setMapsEnabled(true);
      } else {
        existingScript.addEventListener("load", markLoaded);
      }
      return () => existingScript.removeEventListener("load", markLoaded);
    }

    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      setMapsEnabled(false);
      setFareError(
        "Add your Google Maps API key in the code, or use window.__ARIVE_GOOGLE_MAPS_API_KEY__ / NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable live distance pricing."
      );
      return undefined;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.addEventListener("load", markLoaded);
    script.addEventListener("error", () => {
      setMapsEnabled(false);
      setFareError("Google Maps failed to load. Check your API key, restrictions, and enabled APIs.");
    });
    document.head.appendChild(script);

    const handleWindowError = (event: ErrorEvent) => {
      const message = typeof event?.message === "string" ? event.message : "";
      if (message.includes("RefererNotAllowedMapError")) {
        setMapsEnabled(false);
        setMapsLoaded(false);
        setFareError("");
        setHostNotice(
          "This preview domain is not allowed by your Google Maps key. Add this host in Google Cloud referrer restrictions or use arivegroup.co.uk for live address lookup. Manual miles remains available so the booking form still works."
        );
      }
    };

    window.addEventListener("error", handleWindowError);

    return () => {
      script.removeEventListener("load", markLoaded);
      window.removeEventListener("error", handleWindowError);
    };
  }, []);

  useEffect(() => {
  if (
    !mapsEnabled ||
    !mapsLoaded ||
    !pickupInputRef.current ||
    !destinationInputRef.current ||
    !window.google?.maps?.places
  ) {
    return undefined;
  }

  const pickupAutocomplete = new window.google.maps.places.Autocomplete(
    pickupInputRef.current,
    {
      fields: ["formatted_address", "geometry", "name"],
      types: ["geocode"],
    }
  );

  const destinationAutocomplete = new window.google.maps.places.Autocomplete(
    destinationInputRef.current,
    {
      fields: ["formatted_address", "geometry", "name"],
      types: ["geocode"],
    }
  );

  const syncPickup = () => {
    const place = pickupAutocomplete.getPlace();
    const nextPickup =
      place?.formatted_address || place?.name || pickupInputRef.current?.value || "";
    handleChange("pickup", nextPickup);
    setPickupConfirmed(nextPickup);
  };

  const syncDestination = () => {
    const place = destinationAutocomplete.getPlace();
    const nextDestination =
      place?.formatted_address || place?.name || destinationInputRef.current?.value || "";
    handleChange("destination", nextDestination);
    setDestinationConfirmed(nextDestination);
  };

  const pickupListener = pickupAutocomplete.addListener("place_changed", syncPickup);
  const destinationListener = destinationAutocomplete.addListener("place_changed", syncDestination);

  return () => {
    if (pickupListener?.remove) pickupListener.remove();
    if (destinationListener?.remove) destinationListener.remove();
  };
}, [mapsEnabled, mapsLoaded]);

  useEffect(() => {
    if (!mapsEnabled || !mapsLoaded || !window.google?.maps) return;

const pickup = pickupConfirmed.trim();
const destination = destinationConfirmed.trim();

    if (!pickup || !destination) {
      lastRouteKeyRef.current = "";
      setDistanceText("");
      setDurationText("");
      setFareError("");
      setBookingData((prev) => {
        if (prev.miles === "" && prev.distanceMeters === 0) return prev;
        return { ...prev, miles: "", distanceMeters: 0 };
      });
      return;
    }

    const routeKey = `${pickup}__${destination}`;
    if (lastRouteKeyRef.current === routeKey) return;
    lastRouteKeyRef.current = routeKey;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: pickup,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result: any, status: string) => {
        if (status !== "OK" || !result?.routes?.[0]?.legs?.[0]) {
          setFareError("We couldn't calculate the route automatically. You can still enter miles manually below.");
          setDistanceText("");
          setDurationText("");
          setBookingData((prev) => ({ ...prev, miles: "", distanceMeters: 0 }));
          return;
        }

        const leg = result.routes[0].legs[0];
const milesNumber = (leg.distance?.value || 0) / 1609.344;
const miles = milesNumber.toFixed(1);

setFareError("");
setDistanceText(`${miles} mi`);
setDurationText(leg.duration?.text || "");
        setBookingData((prev) => {
          const nextPickup = leg.start_address || prev.pickup;
          const nextDestination = leg.end_address || prev.destination;
          const nextMeters = leg.distance?.value || 0;

          if (
            prev.pickup === nextPickup &&
            prev.destination === nextDestination &&
            prev.miles === miles &&
            prev.distanceMeters === nextMeters
          ) {
            return prev;
          }

          return {
  ...prev,
  miles,
  distanceMeters: nextMeters,
};

        });
      }
    );
  }, [bookingData.pickup, bookingData.destination, mapsEnabled, mapsLoaded]);

  const whatsappMessage = encodeURIComponent(
    [
      "Hello Arive, I would like to request a booking.",
      bookingData.fullName ? `Name: ${bookingData.fullName}` : null,
      bookingData.phone ? `Phone: ${bookingData.phone}` : null,
      bookingData.pickup ? `Pickup: ${bookingData.pickup}` : null,
      bookingData.destination ? `Destination: ${bookingData.destination}` : null,
      bookingData.date ? `Date: ${bookingData.date}` : null,
      bookingData.time ? `Time: ${bookingData.time}` : null,
      `Vehicle: ${bookingData.vehicle}`,
      `Estimated fare: ${formatCurrency(pricing.total)}`,
    ]
      .filter(Boolean)
      .join("\n")
  );

const canShowQuote =
  Boolean(bookingData.pickup.trim()) &&
  Boolean(bookingData.destination.trim()) &&
  Boolean(bookingData.date) &&
  Boolean(bookingData.time);

const canRequestBooking =
  canShowQuote &&
  Boolean(bookingData.fullName.trim()) &&
  Boolean(bookingData.phone.trim());


  return (
    <div className="min-h-screen bg-[#050505] text-[#e7cfaa]">
<header className="border-b border-[#D4AF37]/20 bg-black">
  <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-4 lg:px-10">

  <div className="h-[110px] md:h-[140px] lg:h-[180px] flex items-center justify-center">
    <img
      src="/logo.png"
      alt="Arive Logo"
      className="h-full w-auto object-contain"
    />
  </div>

  <p className="mt-1 text-[9px] uppercase tracking-[0.4em] text-[#8f7a56] text-center">
    Premium private hire with instant quote booking
  </p>

  <nav className="mt-4 flex gap-10 text-[11px] uppercase tracking-[0.35em] text-[#bfa77b]">
    <a href="#services" className="hover:text-white transition">Services</a>
    <a href="#about" className="hover:text-white transition">About</a>
    <a href="#contact" className="hover:text-white transition">Contact</a>
  </nav>

</div>
</header>
      <main>
     <section className="relative overflow-hidden">

  <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 md:py-8g:grid-cols-2 lg:px-10 lg:py-28">
<div className="relative z-10 text-center flex flex-col items-center">

  <p className="mb-2 text-[11px] uppercase tracking-[0.45em] text-[#D4AF37]">
    Premium Private Hire
  </p>

  <h1 className="max-w-4xl text-3xl md:text-5xl lg:text-6xl font-medium leading-[1.05] tracking-[-0.01em] text-[#F2DFBC]">
    Executive travel with a refined edge.
  </h1>

  <p className="mt-4 max-w-2xl text-base md:text-lg leading-7 text-[#CBB38A]">
    Luxury private hire designed for clients who expect reliability,
    comfort, and seamless service from booking to arrival.
  </p>

  <div className="mt-6 flex flex-wrap justify-center gap-4">
    <a
      href="#contact"
      className="rounded-full bg-[#D4AF37] px-8 py-3 text-xs font-medium uppercase tracking-[0.25em] text-black transition hover:scale-[1.03]"
    >
      Book Premium Travel
    </a>

    <a
      href="#services"
      className="rounded-full border border-[#D4AF37]/40 px-8 py-3 text-xs font-medium uppercase tracking-[0.25em] text-[#E7C873] transition hover:border-[#D4AF37] hover:bg-white/5"
    >
      Explore Services
    </a>
  </div>

  <div className="mt-8 grid max-w-3xl grid-cols-2 gap-4 text-xs text-[#E7C873] sm:grid-cols-4">
    {FEATURES.map((item) => (
      <div
        key={item}
        className="rounded-xl border border-[#D4AF37]/10 bg-white/5 px-4 py-3 text-center"
      >
        {item}
      </div>
    ))}
  </div>

</div>


  </div>
</section>

        <section id="services" className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.45em] text-[#d7b988]">Our Services</p>
              <h2 className="mt-3 text-4xl font-medium text-[#F2DFBC] md:text-5xl">Travel tailored to every journey.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[#dbc7a0]">
              From early-morning airport runs to polished executive transport, Arive is built around reliability,
              comfort, and seamless service.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="rounded-[2rem] border border-[#d7b988]/15 bg-white/5 p-8 shadow-sm transition hover:-translate-y-1 hover:border-[#d7b988]/30"
              >
                <div className="mb-5 text-sm uppercase tracking-[0.4em] text-[#d7b988]">Arive</div>
                <h3 className="text-2xl font-semibold text-[#f3e3c6]">{service.title}</h3>
                <p className="mt-4 text-base leading-7 text-[#dbc7a0]">{service.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="border-y border-[#d7b988]/10 bg-white/[0.03]">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:px-10">
            <div>
              <p className="text-sm uppercase tracking-[0.45em] text-[#d7b988]">Why Arive</p>
              <h2 className="mt-3 text-4xl font-semibold text-[#f3e3c6] md:text-5xl">A premium experience from booking to drop-off.</h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-[#dbc7a0]">
              <p>
                Arive is designed for clients who want more than just a lift. Every journey is delivered with
                attention to timing, presentation, and comfort.
              </p>
              <p>
                Whether you need dependable local travel or a polished executive transfer, the focus stays the same:
                a smooth, elevated service every time.
              </p>
            </div>
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[2rem] border border-[#d7b988]/15 bg-white/5 p-8 shadow-sm">
              <p className="text-sm uppercase tracking-[0.45em] text-[#d7b988]">Book Your Journey</p>
              <h2 className="mt-3 text-4xl font-semibold text-[#f3e3c6]">Ready to ride with Arive?</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#dbc7a0]">
                Enter your journey details below for a premium instant quote.
              </p>

              <form className="mt-8 max-w-2xl space-y-4">
<input
  ref={pickupInputRef}
  className="w-full rounded-2xl border border-[#d7b988]/20 bg-black px-5 py-4 text-lg text-[#F2DFBC] outline-none placeholder:text-[#8f7a56]"
  placeholder="Pick-up location"
  defaultValue={bookingData.pickup}
  onChange={() => {
    lastRouteKeyRef.current = "";
    setPickupConfirmed("");
  }}
  onBlur={() => {
    const value = pickupInputRef.current?.value || "";
    handleChange("pickup", value);
    setPickupConfirmed(value);
  }}
/>

 <input
  ref={destinationInputRef}
  className="w-full rounded-2xl border border-[#d7b988]/20 bg-black px-5 py-4 text-lg text-[#F2DFBC] outline-none placeholder:text-[#8f7a56]"
  placeholder="Drop-off location"
  defaultValue={bookingData.destination}
  onChange={() => {
    lastRouteKeyRef.current = "";
    setDestinationConfirmed("");
  }}
  onBlur={() => {
    const value = destinationInputRef.current?.value || "";
    handleChange("destination", value);
    setDestinationConfirmed(value);
  }}
/>

  <div className="grid gap-4 md:grid-cols-3">
<div className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-black px-5 py-4">
  <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-[#8f7a56]">
    Date
  </label>
  <div className="flex items-center justify-between gap-3">
    <input
      type="date"
      className="w-full bg-transparent text-lg text-[#F2DFBC] outline-none [color-scheme:dark]"
      value={bookingData.date}
      onChange={(e) => handleChange("date", e.target.value)}
    />
    <span className="text-[#D4AF37] text-lg">📅</span>
  </div>
</div>
<div className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-black px-5 py-4">
  <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-[#8f7a56]">
    Time
  </label>

  <select
    className="w-full bg-transparent text-lg text-[#F2DFBC] outline-none"
    value={bookingData.time}
    onChange={(e) => handleChange("time", e.target.value)}
  >
    <option value="">Select time</option>

    {Array.from({ length: 24 }).map((_, hour) =>
      ["00", "15", "30", "45"].map((minute) => {
        const h = hour.toString().padStart(2, "0");
        return (
          <option key={`${h}:${minute}`} value={`${h}:${minute}`}>
            {h}:{minute}
          </option>
        );
      })
    )}
  </select>
</div>
    <input
      className="rounded-2xl border border-[#d7b988]/20 bg-black px-4 py-4 text-[#F2DFBC] outline-none placeholder:text-[#8f7a56]"
      placeholder="Passengers"
      value={bookingData.passengers}
      onChange={(e) => handleChange("passengers", e.target.value)}
    />
  </div>

  <div className="rounded-[1.75rem] border border-[#D4AF37]/15 bg-white/5 p-7">
  <p className="text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]">
    Instant Quote
  </p>

{canShowQuote ? (
  <>
    <p className="mt-4 text-5xl font-medium leading-none text-[#F2DFBC]">
      {formatCurrency(pricing.total)}
    </p>

    <p className="mt-3 text-sm leading-6 text-[#CBB38A]">
      A refined estimate for your journey.
    </p>
  </>
) : (
  <>
    <p className="mt-4 text-3xl font-medium leading-none text-[#F2DFBC]">
      Request your quote
    </p>

    <p className="mt-3 text-sm leading-6 text-[#CBB38A]">
      Enter your journey details to receive a tailored fare estimate.
    </p>
  </>
)}

  <div className="mt-5 h-px w-full bg-[#D4AF37]/10" />

 {canShowQuote ? (
  <div className="mt-5 space-y-2 text-sm text-[#CBB38A]">
    {distanceText ? <p>Journey distance: {distanceText}</p> : null}
    {durationText ? <p>Estimated travel time: {durationText}</p> : null}
    {!mapsEnabled && activeMiles > 0 ? <p>Estimated distance: {activeMiles.toFixed(1)} miles</p> : null}
    <p className="text-[#8f7a56]">Final price confirmed on booking.</p>
  </div>
) : null}
</div>

  <div className="grid gap-4 md:grid-cols-2">
    <input
      className="rounded-2xl border border-[#d7b988]/20 bg-black px-4 py-4 text-[#F2DFBC] outline-none placeholder:text-[#8f7a56]"
      placeholder="Full name"
      value={bookingData.fullName}
      onChange={(e) => handleChange("fullName", e.target.value)}
    />
    <input
      className="rounded-2xl border border-[#d7b988]/20 bg-black px-4 py-4 text-[#F2DFBC] outline-none placeholder:text-[#8f7a56]"
      placeholder="Phone number"
      value={bookingData.phone}
      onChange={(e) => handleChange("phone", e.target.value)}
    />
  </div>

  <div className="space-y-2">
    {hostNotice ? <p className="text-sm text-[#f0c989]">{hostNotice}</p> : null}
    {fareError ? <p className="text-sm text-[#f0c989]">{fareError}</p> : null}
    {!hostNotice && !fareError && mapsEnabled ? (
      <p className="text-sm text-[#bfa77b]">
        Distance is calculated automatically from the addresses entered.
      </p>
    ) : null}
  </div>

  <div className="flex flex-wrap gap-4">
    <button
      type="button"
      className="rounded-full bg-[#D4AF37] px-8 py-4 text-sm font-medium uppercase tracking-[0.22em] text-black transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,175,55,0.18)]"
    >
      Request Booking
    </button>

    <a
      href={`https://wa.me/447714700899?text=${whatsappMessage}`}
      className="rounded-full border border-[#D4AF37]/30 px-8 py-4 text-sm font-medium uppercase tracking-[0.22em] text-[#F2DFBC] transition hover:border-[#D4AF37] hover:bg-white/5"
    >
      Book by WhatsApp
    </a>
  </div>
</form>
            </div>

            <div className="rounded-[2rem] border border-[#d7b988]/15 bg-black p-8 shadow-sm">
              <h3 className="text-2xl font-semibold text-[#f3e3c6]">Contact</h3>
              <div className="mt-6 space-y-5 text-[#dbc7a0]">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#d7b988]">Phone</p>
                  <p className="mt-2 text-lg">+44 0000 000000</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#d7b988]">Website</p>
                  <p className="mt-2 text-lg">arivegroup.co.uk</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#d7b988]">Email</p>
                  <p className="mt-2 text-lg">bookings@arive.co.uk</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#d7b988]">Hours</p>
                  <p className="mt-2 text-lg">24/7 by pre-booking</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d7b988]/10 px-6 py-8 text-center text-sm tracking-[0.25em] text-[#a9936d] lg:px-10">
        ARIVE — ARRIVE. ASCEND.
      </footer>
    </div>
  );
}
