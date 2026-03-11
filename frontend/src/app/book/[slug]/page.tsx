// ================================
// PUBLIC BOOKING PAGE — 8-STEP WIZARD
// URL: /book/[slug]
//
// STEPS:
// 1. Select Dates (check-in, check-out, guests)
// 2. Select Room
// 3. Select Package (optional)
// 4. Select Activities (optional, multi-select)
// 5. Select Sessions for chosen activities
// 6. Customer Information
// 7. Review & Confirm
// 8. Payment
// ================================

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  companyApi,
  roomApi,
  packageApi,
  bookingApi,
  activityApi,
  sessionApi,
  invoiceApi,
} from "@/lib/api";
import { formatPrice, calculateNights, formatDate } from "@/lib/helpers";
import { Company, Room, SurfPackage, Activity, Session } from "@/types";

// Represents an activity the user has selected + the session they picked
interface SelectedActivity {
  activity: Activity;
  session: Session | null; // null until they pick a session in step 5
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // ================================
  // STATE
  // ================================
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState<Company | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [packages, setPackages] = useState<SurfPackage[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Step 1: Dates
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  // Step 2: Room
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Step 3: Package
  const [selectedPackage, setSelectedPackage] = useState<SurfPackage | null>(null);

  // Step 4 + 5: Activities & Sessions
  const [selectedActivities, setSelectedActivities] = useState<SelectedActivity[]>([]);
  const [activitySessions, setActivitySessions] = useState<Record<string, Session[]>>({});

  // Step 6: Customer Info
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Step 8: Payment method
  const [paymentMethod, setPaymentMethod] = useState<"pay_on_arrival" | "stripe" | "paypal">("pay_on_arrival");

  // ================================
  // LOAD COMPANY DATA
  // ================================
  useEffect(() => {
    async function loadCompany() {
      try {
        const data = await companyApi.getBySlug(slug);
        setCompany(data.company);

        const [pkgData, actData] = await Promise.all([
          packageApi.getForCompany(data.company._id),
          activityApi.getForCompany(data.company._id),
        ]);
        setPackages(pkgData.packages);
        setActivities(actData.activities);
      } catch (err: any) {
        setError("Company not found.");
      } finally {
        setLoading(false);
      }
    }
    loadCompany();
  }, [slug]);

  // ================================
  // STEP 1: SEARCH ROOMS
  // ================================
  async function searchRooms() {
    if (!checkIn || !checkOut) {
      setError("Please select both check-in and check-out dates.");
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      setError("Check-out must be after check-in.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await roomApi.getAvailable(company!._id, checkIn, checkOut);
      const suitableRooms = data.rooms.filter(
        (room: Room) => room.capacity >= guests
      );
      setRooms(suitableRooms);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to search rooms.");
    } finally {
      setLoading(false);
    }
  }

  // ================================
  // STEP 4: TOGGLE ACTIVITY SELECTION
  // ================================
  function toggleActivity(activity: Activity) {
    setSelectedActivities((prev) => {
      const exists = prev.find((sa) => sa.activity._id === activity._id);
      if (exists) {
        return prev.filter((sa) => sa.activity._id !== activity._id);
      }
      return [...prev, { activity, session: null }];
    });
  }

  // ================================
  // STEP 5: LOAD SESSIONS FOR ACTIVITIES
  // ================================
  async function loadSessionsForActivities() {
    if (selectedActivities.length === 0) return;

    setLoading(true);
    try {
      const sessionsMap: Record<string, Session[]> = {};

      await Promise.all(
        selectedActivities.map(async (sa) => {
          const qp = new URLSearchParams({
            activityId: sa.activity._id,
            companyId: company!._id,
          });
          const data = await sessionApi.get(qp.toString());
          // Filter to sessions within the booking date range
          const filtered = data.sessions.filter((s: Session) => {
            const sDate = new Date(s.date);
            return sDate >= new Date(checkIn) && sDate < new Date(checkOut);
          });
          sessionsMap[sa.activity._id] = filtered;
        })
      );

      setActivitySessions(sessionsMap);
    } catch (err) {
      console.error("Error loading sessions:", err);
    } finally {
      setLoading(false);
    }
  }

  // ================================
  // STEP 5: SELECT SESSION FOR AN ACTIVITY
  // ================================
  function selectSession(activityId: string, session: Session) {
    setSelectedActivities((prev) =>
      prev.map((sa) =>
        sa.activity._id === activityId ? { ...sa, session } : sa
      )
    );
  }

  // ================================
  // PRICE CALCULATION
  // ================================
  function getRoomTotal(): number {
    if (!selectedRoom || !checkIn || !checkOut) return 0;
    return selectedRoom.pricePerNight * calculateNights(checkIn, checkOut);
  }

  function getPackageTotal(): number {
    if (!selectedPackage) return 0;
    return selectedPackage.pricePerPerson * guests;
  }

  function getActivitiesTotal(): number {
    return selectedActivities.reduce((sum, sa) => sum + sa.activity.price, 0);
  }

  function getTotalPrice(): number {
    return getRoomTotal() + getPackageTotal() + getActivitiesTotal();
  }

  // ================================
  // STEP 8: SUBMIT BOOKING + GENERATE INVOICE
  // ================================
  async function submitBooking() {
    if (
      !customerInfo.firstName ||
      !customerInfo.lastName ||
      !customerInfo.email
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const activitiesPayload = selectedActivities
        .filter((sa) => sa.session)
        .map((sa) => ({
          activityId: sa.activity._id,
          sessionId: sa.session!._id,
        }));

      // 1. Create the booking
      const bookingData = await bookingApi.create({
        companyId: company!._id,
        roomId: selectedRoom!._id,
        packageId: selectedPackage?._id || null,
        activities: activitiesPayload.length > 0 ? activitiesPayload : undefined,
        checkIn,
        checkOut,
        numberOfGuests: guests,
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        notes: customerInfo.notes,
      });

      const bookingId = bookingData.booking._id;

      // 2. Generate the invoice
      await invoiceApi.generate({
        bookingId,
        paymentMethod,
      });

      // 3. Redirect to confirmation page
      router.push(`/booking/confirmation/${bookingId}`);
    } catch (err: any) {
      setError(err.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ================================
  // STEP NAVIGATION
  // ================================
  const stepLabels = [
    "Dates",
    "Room",
    "Package",
    "Activities",
    "Sessions",
    "Details",
    "Review",
    "Payment",
  ];

  function goToStep(target: number) {
    setError("");
    if (target === 5 && selectedActivities.length > 0) {
      loadSessionsForActivities();
    }
    setStep(target);
  }

  function handleNextFromActivities() {
    if (selectedActivities.length > 0) {
      goToStep(5);
    } else {
      goToStep(6);
    }
  }

  function handleNextFromSessions() {
    const allHaveSessions = selectedActivities.every((sa) => sa.session);
    if (!allHaveSessions) {
      setError("Please select a session for each activity, or go back and remove it.");
      return;
    }
    goToStep(6);
  }

  // ================================
  // LOADING
  // ================================
  if (loading && !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex items-center gap-3 justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
            <span className="loading-text">Loading surf camp...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h1>
          <p className="text-gray-400">
            The surf company you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  // ================================
  // SUCCESS
  // ================================
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="card max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-500 mb-6">
            Your booking at <strong className="text-gray-700">{company.name}</strong> has been submitted.
            You&apos;ll receive a confirmation email at{" "}
            <strong className="text-gray-700">{customerInfo.email}</strong>.
          </p>
          <div className="bg-gray-50 rounded-xl p-5 text-left space-y-2.5 border border-gray-100">
            <p>
              <span className="text-gray-500">Room:</span>{" "}
              <strong>{selectedRoom?.name}</strong>
            </p>
            <p>
              <span className="text-gray-500">Check-in:</span>{" "}
              <strong>{checkIn}</strong>
            </p>
            <p>
              <span className="text-gray-500">Check-out:</span>{" "}
              <strong>{checkOut}</strong>
            </p>
            <p>
              <span className="text-gray-500">Guests:</span>{" "}
              <strong>{guests}</strong>
            </p>
            {selectedPackage && (
              <p>
                <span className="text-gray-500">Package:</span>{" "}
                <strong>{selectedPackage.name}</strong>
              </p>
            )}
            {selectedActivities.length > 0 && (
              <div>
                <span className="text-gray-500">Activities:</span>
                <ul className="ml-4 list-disc">
                  {selectedActivities.map((sa) => (
                    <li key={sa.activity._id}>
                      <strong>{sa.activity.name}</strong>
                      {sa.session && (
                        <span className="text-gray-500 text-sm">
                          {" "}— {formatDate(sa.session.date)} {sa.session.startTime}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p>
              <span className="text-gray-500">Total:</span>{" "}
              <strong className="text-gray-900">
                {formatPrice(getTotalPrice())}
              </strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ================================
  // MAIN BOOKING PAGE
  // ================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white py-10 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative">
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          <p className="text-white/70 mt-1">{company.description}</p>
          <p className="text-white/50 text-sm mt-2 flex items-center gap-1">
            {company.city}, {company.country}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {stepLabels.map((label, index) => {
            const stepNum = index + 1;
            const isSkipped =
              stepNum === 5 && selectedActivities.length === 0 && step !== 5;
            if (isSkipped) return null;

            return (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all shadow-sm ${
                    step > stepNum
                      ? "bg-emerald-500 text-white"
                      : step === stepNum
                      ? "bg-gray-900 text-white ring-4 ring-gray-100"
                      : "bg-gray-100 text-gray-400 border border-gray-200"
                  }`}
                >
                  {step > stepNum ? "✓" : stepNum}
                </div>
                <span
                  className={`text-xs whitespace-nowrap ${
                    step === stepNum
                      ? "font-semibold text-gray-900"
                      : step > stepNum
                      ? "text-emerald-600 font-medium"
                      : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
                {index < stepLabels.length - 1 && (
                  <div className={`w-8 h-0.5 mx-0.5 rounded-full ${
                    step > stepNum + 1 ? "bg-emerald-300" : step > stepNum ? "bg-gray-200" : "bg-gray-200"
                  }`}></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        {/* STEP 1: SELECT DATES */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              When would you like to stay?
            </h2>
            <p className="text-gray-400 text-sm mb-5">Select your dates and number of guests</p>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div>
                <label className="label">
                  Check-in Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="label">
                  Check-out Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="label">
                  Guests
                </label>
                <select
                  className="input"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {checkIn && checkOut && new Date(checkIn) < new Date(checkOut) && (
              <p className="text-gray-900 mt-4 font-medium">
                {calculateNights(checkIn, checkOut)} night(s)
              </p>
            )}

            <button
              onClick={searchRooms}
              className="btn-primary mt-6 px-8"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search Available Rooms"}
            </button>
          </div>
        )}

        {/* STEP 2: SELECT ROOM */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Choose a Room</h2>
              <button
                onClick={() => goToStep(1)}
                className="text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                ← Change dates
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">
                  No rooms available for your selected dates.
                </p>
                <button onClick={() => goToStep(1)} className="btn-primary mt-4">
                  Try different dates
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {rooms.map((room) => (
                  <div
                    key={room._id}
                    className={`card cursor-pointer transition-all hover:shadow-md ${
                      selectedRoom?._id === room._id
                        ? "ring-2 ring-gray-500 bg-gray-50/30"
                        : "hover:border-gray-200"
                    }`}
                    onClick={() => setSelectedRoom(room)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{room.name}</h3>
                        <p className="text-gray-400 text-sm capitalize">
                          {room.type} · Up to {room.capacity} guests
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          {formatPrice(room.pricePerNight)}
                        </p>
                        <p className="text-gray-400 text-xs">per night</p>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">
                      {room.description}
                    </p>
                    {room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {room.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="badge bg-gray-100 text-gray-700"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedRoom && (
              <div className="mt-6 flex justify-between items-center bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-gray-600">
                  Selected:{" "}
                  <strong className="text-gray-800">
                    {selectedRoom.name} —{" "}
                    {formatPrice(
                      selectedRoom.pricePerNight *
                        calculateNights(checkIn, checkOut)
                    )}
                  </strong>{" "}
                  for {calculateNights(checkIn, checkOut)} night(s)
                </p>
                <button onClick={() => goToStep(3)} className="btn-primary px-8">
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: SELECT PACKAGE (OPTIONAL) */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Add a Surf Package{" "}
                <span className="text-gray-400 text-sm font-normal">(optional)</span>
              </h2>
              <button
                onClick={() => goToStep(2)}
                className="text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                ← Change room
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg._id}
                  className={`card cursor-pointer transition-all hover:shadow-md ${
                    selectedPackage?._id === pkg._id
                      ? "ring-2 ring-gray-500 bg-gray-50/30"
                      : "hover:border-gray-200"
                  }`}
                  onClick={() =>
                    setSelectedPackage(
                      selectedPackage?._id === pkg._id ? null : pkg
                    )
                  }
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{pkg.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {pkg.durationDays} days ·{" "}
                        <span className="capitalize">{pkg.difficulty}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {formatPrice(pkg.pricePerPerson)}
                      </p>
                      <p className="text-gray-400 text-xs">per person</p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">{pkg.description}</p>
                  {pkg.includes.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {pkg.includes.map((item) => (
                        <li
                          key={item}
                          className="text-sm text-gray-600 flex items-center gap-2"
                        >
                          <span className="text-emerald-500">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-gray-600">
                Running total:{" "}
                <strong className="text-gray-900">
                  {formatPrice(getRoomTotal() + getPackageTotal())}
                </strong>
              </p>
              <button onClick={() => goToStep(4)} className="btn-primary px-8">
                {selectedPackage ? "Continue" : "Skip — No Package"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SELECT ACTIVITIES (OPTIONAL, MULTI-SELECT) */}
        {step === 4 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Activities{" "}
                <span className="text-gray-400 text-sm font-normal">(optional)</span>
              </h2>
              <button
                onClick={() => goToStep(3)}
                className="text-gray-900 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                ← Back to packages
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">No activities available at the moment.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {activities.map((activity) => {
                  const isSelected = selectedActivities.some(
                    (sa) => sa.activity._id === activity._id
                  );
                  return (
                    <div
                      key={activity._id}
                      className={`card cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? "ring-2 ring-gray-400 bg-gray-50/30" : "hover:border-gray-200"
                      }`}
                      onClick={() => toggleActivity(activity)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-md border-2 mt-1 flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-gray-900 border-gray-900 text-white"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && <span className="text-xs">✓</span>}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{activity.name}</h3>
                            <p className="text-gray-400 text-sm">
                              {activity.duration} min · Max {activity.capacity}
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-gray-900">
                          {formatPrice(activity.price)}
                        </p>
                      </div>
                      {activity.description && (
                        <p className="text-gray-500 text-sm mt-2 ml-8">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-between items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-gray-600">
                {selectedActivities.length > 0 ? (
                  <>
                    {selectedActivities.length} activit
                    {selectedActivities.length === 1 ? "y" : "ies"} selected
                    {" — "}
                    <strong className="text-gray-900">
                      +{formatPrice(getActivitiesTotal())}
                    </strong>
                  </>
                ) : (
                  "No activities selected"
                )}
              </p>
              <button onClick={handleNextFromActivities} className="btn-primary px-8">
                {selectedActivities.length > 0
                  ? "Choose Time Slots"
                  : "Skip — No Activities"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SELECT SESSIONS FOR EACH ACTIVITY */}
        {step === 5 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Choose Time Slots</h2>
              <button
                onClick={() => goToStep(4)}
                className="text-gray-900 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                ← Back to activities
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 py-12">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                <span className="loading-text">Loading available sessions...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {selectedActivities.map((sa) => {
                  const sessions = activitySessions[sa.activity._id] || [];
                  return (
                    <div key={sa.activity._id} className="card">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {sa.activity.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3">
                        Select a time slot below
                      </p>

                      {sessions.length === 0 ? (
                        <div className="alert-warning">
                          No sessions available during your stay dates. You can go
                          back and remove this activity.
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {sessions.map((session) => {
                            const spotsLeft = session.capacity - session.bookedCount;
                            const isFull = spotsLeft <= 0;
                            const isSelected = sa.session?._id === session._id;

                            return (
                              <button
                                key={session._id}
                                disabled={isFull}
                                onClick={() =>
                                  selectSession(sa.activity._id, session)
                                }
                                className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                                  isSelected
                                    ? "border-gray-900 bg-gray-50 shadow-md"
                                    : isFull
                                    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                    : "border-gray-100 hover:border-gray-300 hover:shadow-sm cursor-pointer"
                                }`}
                              >
                                <p className="font-medium text-sm text-gray-600">
                                  {formatDate(session.date)}
                                </p>
                                <p className="text-gray-900 font-semibold">
                                  {session.startTime} – {session.endTime}
                                </p>
                                <p
                                  className={`text-xs mt-1 font-medium ${
                                    isFull
                                      ? "text-red-500"
                                      : spotsLeft <= 2
                                      ? "text-amber-600"
                                      : "text-emerald-600"
                                  }`}
                                >
                                  {isFull
                                    ? "Full"
                                    : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-between items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-gray-600">
                Running total:{" "}
                <strong className="text-gray-900">
                  {formatPrice(getTotalPrice())}
                </strong>
              </p>
              <button onClick={handleNextFromSessions} className="btn-primary px-8">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: CUSTOMER DETAILS */}
        {step === 6 && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Your Details</h2>
                <button
                  onClick={() =>
                    goToStep(selectedActivities.length > 0 ? 5 : 4)
                  }
                  className="text-gray-900 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  ← Back
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      First Name *
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={customerInfo.firstName}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          firstName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="label">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={customerInfo.lastName}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          lastName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">
                    Email *
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="input"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="label">
                    Special Requests
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Any special requests or notes..."
                    value={customerInfo.notes}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <button
                onClick={() => goToStep(7)}
                className="btn-primary mt-6 px-8"
              >
                Review Booking
              </button>
            </div>

            {/* Mini Summary Sidebar */}
            <div className="card h-fit bg-gray-50 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Room</span>
                  <span className="font-medium text-gray-700">{selectedRoom?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Nights</span>
                  <span className="font-medium text-gray-700">{calculateNights(checkIn, checkOut)}</span>
                </div>
                {selectedPackage && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Package</span>
                    <span className="font-medium text-gray-700">{selectedPackage.name}</span>
                  </div>
                )}
                {selectedActivities.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Activities</span>
                    <span className="font-medium text-gray-700">{selectedActivities.length}</span>
                  </div>
                )}
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: REVIEW & CONFIRM */}
        {step === 7 && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Review Your Booking</h2>
                <button
                  onClick={() => goToStep(6)}
                  className="text-gray-900 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  ← Edit details
                </button>
              </div>

              {/* Guest Info */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Guest Information
                </h3>
                <p className="font-medium">
                  {customerInfo.firstName} {customerInfo.lastName}
                </p>
                <p className="text-gray-600 text-sm">{customerInfo.email}</p>
                {customerInfo.phone && (
                  <p className="text-gray-600 text-sm">{customerInfo.phone}</p>
                )}
                {customerInfo.notes && (
                  <p className="text-gray-500 text-sm mt-1 italic">
                    &ldquo;{customerInfo.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Stay Details */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Stay Details
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Check-in:</span>{" "}
                    <strong>{checkIn}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Check-out:</span>{" "}
                    <strong>{checkOut}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Nights:</span>{" "}
                    <strong>{calculateNights(checkIn, checkOut)}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Guests:</span>{" "}
                    <strong>{guests}</strong>
                  </div>
                </div>
              </div>

              {/* Room */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Room
                </h3>
                <p className="font-medium">{selectedRoom?.name}</p>
                <p className="text-gray-500 text-sm capitalize">
                  {selectedRoom?.type}
                </p>
              </div>

              {/* Package */}
              {selectedPackage && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Package
                  </h3>
                  <p className="font-medium">{selectedPackage.name}</p>
                  <p className="text-gray-500 text-sm">
                    {selectedPackage.durationDays} days ·{" "}
                    {formatPrice(selectedPackage.pricePerPerson)}/person
                  </p>
                </div>
              )}

              {/* Activities */}
              {selectedActivities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Activities
                  </h3>
                  <div className="space-y-2">
                    {selectedActivities.map((sa) => (
                      <div
                        key={sa.activity._id}
                        className="flex justify-between items-center text-sm"
                      >
                        <div>
                          <p className="font-medium">{sa.activity.name}</p>
                          {sa.session && (
                            <p className="text-gray-500">
                              {formatDate(sa.session.date)}{" "}
                              {sa.session.startTime} – {sa.session.endTime}
                            </p>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {formatPrice(sa.activity.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button onClick={() => goToStep(6)} className="btn-secondary">
                  ← Back
                </button>
                <button
                  onClick={() => goToStep(8)}
                  className="btn-primary px-8"
                >
                  Continue to Payment
                </button>
              </div>
            </div>

            {/* Price Breakdown Sidebar */}
            <div className="card h-fit bg-gray-50 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Price Breakdown</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Room ({calculateNights(checkIn, checkOut)} nights)
                  </span>
                  <span className="font-medium text-gray-700">{formatPrice(getRoomTotal())}</span>
                </div>

                {selectedPackage && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Package ({guests} guest{guests !== 1 ? "s" : ""})
                    </span>
                    <span className="font-medium text-gray-700">{formatPrice(getPackageTotal())}</span>
                  </div>
                )}

                {selectedActivities.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Activities ({selectedActivities.length})
                    </span>
                    <span className="font-medium text-gray-700">{formatPrice(getActivitiesTotal())}</span>
                  </div>
                )}

                <hr className="border-gray-200" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* STEP 8: PAYMENT */}
        {step === 8 && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 card">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Payment</h2>
              <p className="text-gray-400 text-sm mb-6">
                Choose how you&apos;d like to pay for your booking.
              </p>

              {/* Payment Method Selector */}
              <div className="space-y-3 mb-6">
                {([
                  {
                    id: "pay_on_arrival" as const,
                    label: "Pay on Arrival",
                    desc: "Pay at the surf camp when you check in",
                  },
                  {
                    id: "stripe" as const,
                    label: "Stripe",
                    desc: "Secure online card payment",
                  },
                  {
                    id: "paypal" as const,
                    label: "PayPal",
                    desc: "Pay with your PayPal account",
                  },
                ]).map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === method.id
                        ? "border-gray-900 bg-gray-50/50 shadow-sm"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div>
                      <div className="w-3 h-3 rounded-full bg-gray-900 shrink-0 mt-1"></div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{method.label}</p>
                      <p className="text-sm text-gray-500">{method.desc}</p>
                    </div>
                    <div className="ml-auto">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === method.id
                          ? "border-gray-900 bg-gray-500"
                          : "border-gray-300"
                      }`}>
                        {paymentMethod === method.id && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Payment method details */}
              {paymentMethod === "pay_on_arrival" && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
                  <p className="text-sm text-gray-600">
                    Your booking will be confirmed immediately. Please pay at the reception when you arrive.
                  </p>
                </div>
              )}

              {paymentMethod === "stripe" && (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 mb-6">
                  <p className="text-sm text-gray-600">
                    Stripe integration coming soon. Your booking will be created and you can pay later.
                  </p>
                </div>
              )}

              {paymentMethod === "paypal" && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                  <p className="text-sm text-gray-600">
                    PayPal integration coming soon. Your booking will be created and you can pay later.
                  </p>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button onClick={() => goToStep(7)} className="btn-secondary">
                  ← Back
                </button>
                <button
                  onClick={submitBooking}
                  className="btn-primary px-8"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Complete Booking"}
                </button>
              </div>
            </div>

            {/* Price Summary */}
            <div className="card h-fit bg-gray-50 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Room ({calculateNights(checkIn, checkOut)} nights)
                  </span>
                  <span className="font-medium text-gray-700">{formatPrice(getRoomTotal())}</span>
                </div>
                {selectedPackage && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Package ({guests} guest{guests !== 1 ? "s" : ""})
                    </span>
                    <span className="font-medium text-gray-700">{formatPrice(getPackageTotal())}</span>
                  </div>
                )}
                {selectedActivities.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Activities ({selectedActivities.length})
                    </span>
                    <span className="font-medium text-gray-700">{formatPrice(getActivitiesTotal())}</span>
                  </div>
                )}
                <hr className="border-gray-200" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
