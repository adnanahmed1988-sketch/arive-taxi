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
];

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

  if (
    typeof GOOGLE_MAPS_API_KEY === "string" &&
    GOOGLE_MAPS_API_KEY.trim() &&
    GOOGLE_MAPS_API_KEY !== "PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE"
  ) {
    return GOOGLE_MAPS_API_KEY.trim();
  }

  return "";
}

function isSandboxHost() {
  if (typeof window === "undefined") return false;
  return SANDBOX_HOSTS.includes(window.location.hostname);
}

function formatCurrency(value) {
  return `£${value.toFixed(2)}`;
}

export default function AriveTaxiWebsite() {
  const pickupInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const lastRouteKeyRef = useRef("");

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsEnabled, setMapsEnabled] = useState(false);
  const [distanceText, setDistanceText] = useState("");
  const [durationText, setDurationText] = useState("");
  const [fareError, setFareError] = useState("");
  const [hostNotice, setHostNotice] = useState("");

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

  const handleChange = (key, value) => {
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
      if (!bookingData[extra.key]) return sum;
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

    const handleWindowError = (event) => {
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
    if (!mapsEnabled || !mapsLoaded || !pickupInputRef.current || !destinationInputRef.current || !window.google?.maps?.places) {
      return undefined;
    }

    const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
      fields: ["formatted_address", "geometry", "name"],
      types: ["geocode"],
    });

    const destinationAutocomplete = new window.google.maps.places.Autocomplete(destinationInputRef.current, {
      fields: ["formatted_address", "geometry", "name"],
      types: ["geocode"],
    });

    const syncPickup = () => {
      const place = pickupAutocomplete.getPlace();
      const nextPickup = place?.formatted_address || place?.name || pickupInputRef.current?.value || "";
      handleChange("pickup", nextPickup);
    };

    const syncDestination = () => {
      const place = destinationAutocomplete.getPlace();
      const nextDestination = place?.formatted_address || place?.name || destinationInputRef.current?.value || "";
      handleChange("destination", nextDestination);
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

    const pickup = bookingData.pickup.trim();
    const destination = bookingData.destination.trim();

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
      (result, status) => {
        if (status !== "OK" || !result?.routes?.[0]?.legs?.[0]) {
          setFareError("We couldn't calculate the route automatically. You can still enter miles manually below.");
          setDistanceText("");
          setDurationText("");
          setBookingData((prev) => ({ ...prev, miles: "", distanceMeters: 0 }));
          return;
        }

        const leg = result.routes[0].legs[0];
        const miles = ((leg.distance?.value || 0) / 1609.344).toFixed(1);

        setFareError("");
        setDistanceText(leg.distance?.text || "");
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
            pickup: nextPickup,
            destination: nextDestination,
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

  return (
    <div className="min-h-screen bg-[#050816] text-[#e7cfaa]">
      <header className="border-b border-[#c8aa74]/20 bg-[#050816]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <div>
            <div className="flex items-center gap-3">
             <img
  src="/logo.png"
  alt="Arive Logo"
  className="h-20 md:h-24 lg:h-28 w-auto object-contain"
/>
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[#9d8a68]">
              Premium private hire with instant quote booking
            </div>
          </div>
          <nav className="hidden gap-8 text-sm uppercase tracking-[0.25em] md:flex">
            <a href="#services" className="transition hover:text-white">Services</a>
            <a href="#about" className="transition hover:text-white">About</a>
            <a href="#contact" className="transition hover:text-white">Contact</a>
          </nav>
        </div>
      </header>

      <main>
     <section className="relative overflow-hidden">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,170,116,0.18),transparent_40%)]" />
  <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-2 lg:px-10 lg:py-28">
    <div className="relative z-10">
      <p className="mb-4 text-sm uppercase tracking-[0.45em] text-[#d7b988]">
        Premium Private Hire
      </p>
      <h1 className="max-w-xl text-5xl font-semibold leading-tight text-[#f3e3c6] md:text-7xl">
        Executive travel with a refined edge.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-[#dbc7a0]">
        Arive delivers dependable, luxury taxi and private hire journeys for airport transfers,
        business travel, and special occasions.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <a
          href="#contact"
          className="rounded-2xl border border-[#d7b988] bg-[#d7b988] px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-[#050816] shadow-lg transition hover:scale-[1.02]"
        >
          Book Premium Travel
        </a>
        <a
          href="#services"
          className="rounded-2xl border border-[#d7b988]/40 px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] transition hover:border-[#d7b988] hover:bg-white/5"
        >
          Explore Services
        </a>
      </div>
      <div className="mt-12 grid max-w-xl grid-cols-2 gap-4 text-sm text-[#e7cfaa] sm:grid-cols-4">
        {FEATURES.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-[#d7b988]/15 bg-white/5 p-4 shadow-sm"
          >
            {item}
          </div>
        ))}
      </div>
    </div>

    <div className="relative z-10 flex items-center justify-center">
      <img
        src="/logo.png"
        alt="Arive Logo"
        className="w-64 md:w-80 lg:w-[500px] object-contain drop-shadow-[0_0_40px_rgba(242,223,188,0.25)]"
      />
    </div>
  </div>
</section>

        <section id="services" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.45em] text-[#d7b988]">Our Services</p>
              <h2 className="mt-3 text-4xl font-semibold text-[#f3e3c6] md:text-5xl">Travel tailored to every journey.</h2>
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
                className="rounded-[2rem] border border-[#d7b988]/15 bg-white/5 p-8 shadow-lg transition hover:-translate-y-1 hover:border-[#d7b988]/30"
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
            <div className="rounded-[2rem] border border-[#d7b988]/15 bg-white/5 p-8 shadow-xl">
              <p className="text-sm uppercase tracking-[0.45em] text-[#d7b988]">Book Your Journey</p>
              <h2 className="mt-3 text-4xl font-semibold text-[#f3e3c6]">Ready to ride with Arive?</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#dbc7a0]">
                Enter your journey details below for a premium instant quote based on distance,
                vehicle choice, and extras.
              </p>

              <form className="mt-8 grid gap-4 md:grid-cols-2">
                <input
                  className="rounded-2xl border border-[#d7b988]/20 bg-[#071024] px-4 py-3 text-[#f3e3c6] outline-none placeholder:text-[#9d8a68]"
                  placeholder="Full name"
                  value={bookingData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                />
                <input
                  className="rounded-2xl border border-[#d7b988]/20 bg-[#071024] px-4 py-3 text-[#f3e3c6] outline-none placeholder:text-[#9d8a68]"
                  placeholder="Phone number"
                  value={bookingData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
                <input
                  className="rounded-2xl border border-[#d7b988]/20 bg-[#071024] px-4 py-3 text-[#f3e3c6] outline-none placeholder:text-[#9d8a68]"
                  placeholder="Email address"
                  value={bookingData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
                <input
                  className="rounded-2xl border border-[#d7b988]/20 bg-[#071024] px-4 py-3 text-[#f3e3c6] outline-none placeholder:text-[#9d8a68]"
                  placeholder="Passengers"
                  value={bookingData.passengers}
                  onChange={(e) => handleChange("passengers", e.target.value)}
                />
                <input
                  ref={pickupInputRef}
                  className="rounded-2xl border border-[#d7b988]/20 bg-[#071024] px-4 py-3 text-[#f3e3c6] outline-none placeholder:text-[#9d8a68] md:col-span-2"
                  placeholder={mapsEnabled ? "Pickup location" : "Pickup location (manual entry in preview)"}
                  value={bookingData.pickup}
                  onChange={(e) => {
                    lastRouteKeyRef.current = "";
                    handleChange("pickup", e.target.value);
                  }}
                />
                <input
                  ref={destinationInputRef}
                  className="rounded-2xl border border-[#d7b988]/20 bg-[#071024] px-4 py-3 text-[#f3e3c6] outline-none placeholder:text-[#9d8a68] md:col-span-2"
                  placeholder={mapsEnabled ? "Destination" : "Destination (manual entry in preview)"}
                  value={bookingData.destination}
                  onChange={(e) => {
                    lastRouteKeyRef.current = "";
                    handleChange("destination", e.target.value);
                  }}
                />
                <input
                  className="rounded-2xl border border-[#d7b988]/20 bg-[#071024] px-4 py-3 text-[#f3e3c6] outline-none"
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
                <input
                  className="rounded-2xl border border-[#d7b988]/20 bg-[#071024] px-4 py-3 text-[#f3e3c6] outline-none"
                  type="time"
                  value={bookingData.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                />
                <select
                  className="rounded-2xl border border-[#d7b988]/20 bg-[#071024] px-4 py-3 text-[#f3e3c6] outline-none"
                  value={bookingData.journeyType}
                  onChange={(e) => handleChange("journeyType", e.target.value)}
                >
                  <option>Airport transfer</option>
                  <option>Business travel</option>
                  <option>Private hire</option>
                  <option>Long distance</option>
                </select>
                <select
                  className="rounded-2xl border border-[#d7b988]/20 bg-[#071024] px-4 py-3 text-[#f3e3c6] outline-none"
                  value={bookingData.vehicle}
                  onChange={(e) => handleChange("vehicle", e.target.value)}
                >
                  {VEHICLE_OPTIONS.map((option) => (
                    <option key={option.name} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>

                {mapsEnabled ? (
                  <input
                    className="rounded-2xl border border-[#d7b988]/20 bg-[#071024] px-4 py-3 text-[#f3e3c6] outline-none placeholder:text-[#9d8a68]"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Miles (auto-calculated)"
                    value={bookingData.miles}
                    readOnly
                  />
                ) : (
                  <input
                    className="rounded-2xl border border-[#d7b988]/20 bg-[#071024] px-4 py-3 text-[#f3e3c6] outline-none placeholder:text-[#9d8a68]"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Enter miles manually"
                    value={bookingData.manualMiles}
                    onChange={(e) => handleChange("manualMiles", e.target.value)}
                  />
                )}

                <div className="md:col-span-2 rounded-[1.5rem] border border-[#d7b988]/15 bg-[#050816] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-[#d7b988]">Instant Quote</p>
                      <p className="mt-3 text-4xl font-semibold text-[#f3e3c6]">{formatCurrency(pricing.total)}</p>
                      <p className="mt-2 text-sm leading-6 text-[#bfa77b]">
                        Premium booking estimate based on route, vehicle, and selected extras.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#d7b988]/10 bg-white/5 px-4 py-3 text-sm leading-6 text-[#dbc7a0]">
                      <p>Vehicle: {pricing.selectedVehicle.name}</p>
                      <p>Style: {pricing.selectedVehicle.note}</p>
                      {distanceText ? <p>Distance: {distanceText}</p> : null}
                      {durationText ? <p>Drive time: {durationText}</p> : null}
                      {!mapsEnabled && activeMiles > 0 ? <p>Manual miles: {activeMiles.toFixed(1)}</p> : null}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-[#d7b988]/10 bg-white/5 p-4 text-sm leading-7 text-[#dbc7a0]">
                      <p className="text-xs uppercase tracking-[0.3em] text-[#d7b988]">Fare Breakdown</p>
                      <p className="mt-2">Start fare: {formatCurrency(pricing.baseFare)}</p>
                      <p>Distance charge: {formatCurrency(pricing.distanceFare)}</p>
                      <p>Extras: {formatCurrency(pricing.extrasTotal)}</p>
                      <p>Vehicle multiplier: x{pricing.vehicleMultiplier.toFixed(2)}</p>
                      <p>{bookingData.returnJourney ? "Return journey: Included" : "Return journey: One way"}</p>
                    </div>
                    <div className="rounded-2xl border border-[#d7b988]/10 bg-white/5 p-4 text-sm leading-7 text-[#dbc7a0]">
                      <p className="text-xs uppercase tracking-[0.3em] text-[#d7b988]">Premium Experience</p>
                      <p className="mt-2">Instant quote engine</p>
                      <p>Luxury vehicle selection</p>
                      <p>Airport extras and add-ons</p>
                      <p>WhatsApp booking option</p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 rounded-[1.5rem] border border-[#d7b988]/15 bg-[#071024] p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#d7b988]">Enhance Your Journey</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {EXTRAS.map((extra) => (
                      <label
                        key={extra.key}
                        className="flex items-center justify-between rounded-2xl border border-[#d7b988]/10 bg-white/5 px-4 py-3 text-sm text-[#dbc7a0]"
                      >
                        <span>{extra.label}</span>
                        <span className="flex items-center gap-3">
                          <span>{extra.price > 0 ? `+${formatCurrency(extra.price)}` : "Doubles fare"}</span>
                          <input
                            type="checkbox"
                            checked={bookingData[extra.key]}
                            onChange={(e) => handleChange(extra.key, e.target.checked)}
                          />
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  {hostNotice ? <p className="text-sm text-[#f0c989]">{hostNotice}</p> : null}
                  {fareError ? <p className="text-sm text-[#f0c989]">{fareError}</p> : null}
                  {!hostNotice && !fareError && mapsEnabled ? (
                    <p className="text-sm text-[#bfa77b]">Distance is calculated automatically from the addresses entered.</p>
                  ) : null}
                </div>

                <textarea
                  className="min-h-[140px] rounded-2xl border border-[#d7b988]/20 bg-[#071024] px-4 py-3 text-[#f3e3c6] outline-none placeholder:text-[#9d8a68] md:col-span-2"
                  placeholder="Flight number, child seats, luggage, return trip, or any special requests"
                  value={bookingData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />

                <div className="md:col-span-2 flex flex-wrap gap-4">
                  <button
                    type="button"
                    className="rounded-2xl border border-[#d7b988] bg-[#d7b988] px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-[#050816] shadow-lg transition hover:scale-[1.02]"
                  >
                    Request Booking
                  </button>
                  <a
                    href={`https://wa.me/440000000000?text=${whatsappMessage}`}
                    className="rounded-2xl border border-[#d7b988]/40 px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] transition hover:border-[#d7b988] hover:bg-white/5"
                  >
                    Book by WhatsApp
                  </a>
                </div>
              </form>
            </div>

            <div className="rounded-[2rem] border border-[#d7b988]/15 bg-[#071024] p-8 shadow-xl">
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
