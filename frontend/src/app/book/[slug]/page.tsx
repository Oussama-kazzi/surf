// ================================
// PUBLIC BOOKING PAGE — 7-STEP WIZARD
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
// ================================

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  companyApi,
  roomApi,
  packageApi,
  bookingApi,
  activityApi,
  sessionApi,
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
  // STEP 7: SUBMIT BOOKING
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

      await bookingApi.create({
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

      setSuccess(true);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🏄</div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">Company Not Found</h1>
          <p className="text-gray-500">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-ocean-50 to-white px-4">
        <div className="card max-w-lg w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 mb-6">
            Your booking at <strong>{company.name}</strong> has been submitted.
            You&apos;ll receive a confirmation email at{" "}
            <strong>{customerInfo.email}</strong>.
          </p>
          <div className="bg-ocean-50 rounded-lg p-4 text-left space-y-2">
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
              <strong className="text-ocean-600">
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
    <div className="min-h-screen bg-gradient-to-b from-ocean-50 to-white">
      {/* Header */}
      <div className="bg-ocean-700 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-ocean-200 mt-1">{company.description}</p>
          <p className="text-ocean-300 text-sm mt-2">
            📍 {company.city}, {company.country}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-1 mb-8 overflow-x-auto">
          {stepLabels.map((label, index) => {
            const stepNum = index + 1;
            const isSkipped =
              stepNum === 5 && selectedActivities.length === 0 && step !== 5;
            if (isSkipped) return null;

            return (
              <div key={label} className="flex items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    step > stepNum
                      ? "bg-green-500 text-white"
                      : step === stepNum
                      ? "bg-ocean-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > stepNum ? "✓" : stepNum}
                </div>
                <span
                  className={`text-xs whitespace-nowrap ${
                    step === stepNum
                      ? "font-medium text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
                {index < stepLabels.length - 1 && (
                  <div className="w-6 h-px bg-gray-300 mx-0.5"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* STEP 1: SELECT DATES */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">
              When would you like to stay?
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <p className="text-ocean-600 mt-4 font-medium">
                📅 {calculateNights(checkIn, checkOut)} night(s)
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Choose a Room</h2>
              <button
                onClick={() => goToStep(1)}
                className="text-ocean-600 hover:underline text-sm"
              >
                ← Change dates
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-4">😢</div>
                <p className="text-gray-600">
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
                        ? "ring-2 ring-ocean-500"
                        : ""
                    }`}
                    onClick={() => setSelectedRoom(room)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{room.name}</h3>
                        <p className="text-gray-500 text-sm capitalize">
                          {room.type} · Up to {room.capacity} guests
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-ocean-600">
                          {formatPrice(room.pricePerNight)}
                        </p>
                        <p className="text-gray-400 text-xs">per night</p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mt-2">
                      {room.description}
                    </p>
                    {room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {room.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="badge bg-ocean-50 text-ocean-700"
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
              <div className="mt-6 flex justify-between items-center">
                <p className="text-gray-600">
                  Selected:{" "}
                  <strong>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Add a Surf Package{" "}
                <span className="text-gray-400 text-sm font-normal">(optional)</span>
              </h2>
              <button
                onClick={() => goToStep(2)}
                className="text-ocean-600 hover:underline text-sm"
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
                      ? "ring-2 ring-ocean-500"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedPackage(
                      selectedPackage?._id === pkg._id ? null : pkg
                    )
                  }
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{pkg.name}</h3>
                      <p className="text-gray-500 text-sm">
                        {pkg.durationDays} days ·{" "}
                        <span className="capitalize">{pkg.difficulty}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-ocean-600">
                        {formatPrice(pkg.pricePerPerson)}
                      </p>
                      <p className="text-gray-400 text-xs">per person</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">{pkg.description}</p>
                  {pkg.includes.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {pkg.includes.map((item) => (
                        <li
                          key={item}
                          className="text-sm text-gray-600 flex items-center gap-2"
                        >
                          <span className="text-green-500">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <p className="text-gray-600">
                Running total:{" "}
                <strong className="text-ocean-600">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Add Activities{" "}
                <span className="text-gray-400 text-sm font-normal">(optional)</span>
              </h2>
              <button
                onClick={() => goToStep(3)}
                className="text-ocean-600 hover:underline text-sm"
              >
                ← Back to packages
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-500">No activities available at the moment.</p>
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
                        isSelected ? "ring-2 ring-ocean-500" : ""
                      }`}
                      onClick={() => toggleActivity(activity)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded border-2 mt-1 flex items-center justify-center ${
                              isSelected
                                ? "bg-ocean-600 border-ocean-600 text-white"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && <span className="text-xs">✓</span>}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{activity.name}</h3>
                            <p className="text-gray-500 text-sm">
                              ⏱ {activity.duration} min · 👥 Max {activity.capacity}
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-ocean-600">
                          {formatPrice(activity.price)}
                        </p>
                      </div>
                      {activity.description && (
                        <p className="text-gray-600 text-sm mt-2 ml-8">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-between items-center">
              <p className="text-gray-600">
                {selectedActivities.length > 0 ? (
                  <>
                    {selectedActivities.length} activit
                    {selectedActivities.length === 1 ? "y" : "ies"} selected
                    {" — "}
                    <strong className="text-ocean-600">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Choose Time Slots</h2>
              <button
                onClick={() => goToStep(4)}
                className="text-ocean-600 hover:underline text-sm"
              >
                ← Back to activities
              </button>
            </div>

            {loading ? (
              <p className="text-gray-500">Loading available sessions...</p>
            ) : (
              <div className="space-y-6">
                {selectedActivities.map((sa) => {
                  const sessions = activitySessions[sa.activity._id] || [];
                  return (
                    <div key={sa.activity._id} className="card">
                      <h3 className="font-semibold text-lg mb-1">
                        {sa.activity.name}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3">
                        Select a time slot below
                      </p>

                      {sessions.length === 0 ? (
                        <p className="text-yellow-600 text-sm">
                          No sessions available during your stay dates. You can go
                          back and remove this activity.
                        </p>
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
                                className={`p-3 rounded-lg border text-left transition-all ${
                                  isSelected
                                    ? "border-ocean-500 bg-ocean-50 ring-2 ring-ocean-500"
                                    : isFull
                                    ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                                    : "border-gray-200 hover:border-ocean-300 cursor-pointer"
                                }`}
                              >
                                <p className="font-medium text-sm">
                                  {formatDate(session.date)}
                                </p>
                                <p className="text-ocean-600 font-semibold">
                                  {session.startTime} – {session.endTime}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isFull
                                      ? "text-red-500"
                                      : spotsLeft <= 2
                                      ? "text-yellow-600"
                                      : "text-green-600"
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

            <div className="mt-6 flex justify-between items-center">
              <p className="text-gray-600">
                Running total:{" "}
                <strong className="text-ocean-600">
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Details</h2>
                <button
                  onClick={() =>
                    goToStep(selectedActivities.length > 0 ? 5 : 4)
                  }
                  className="text-ocean-600 hover:underline text-sm"
                >
                  ← Back
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <div className="card h-fit">
              <h3 className="font-semibold mb-4">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Room</span>
                  <span>{selectedRoom?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nights</span>
                  <span>{calculateNights(checkIn, checkOut)}</span>
                </div>
                {selectedPackage && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Package</span>
                    <span>{selectedPackage.name}</span>
                  </div>
                )}
                {selectedActivities.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Activities</span>
                    <span>{selectedActivities.length}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-ocean-600">
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Review Your Booking</h2>
                <button
                  onClick={() => goToStep(6)}
                  className="text-ocean-600 hover:underline text-sm"
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
                        <span className="font-medium text-ocean-600">
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
                  onClick={submitBooking}
                  className="btn-primary px-8"
                  disabled={loading}
                >
                  {loading ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </div>

            {/* Price Breakdown Sidebar */}
            <div className="card h-fit">
              <h3 className="font-semibold mb-4">Price Breakdown</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Room ({calculateNights(checkIn, checkOut)} nights)
                  </span>
                  <span>{formatPrice(getRoomTotal())}</span>
                </div>

                {selectedPackage && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Package ({guests} guest{guests !== 1 ? "s" : ""})
                    </span>
                    <span>{formatPrice(getPackageTotal())}</span>
                  </div>
                )}

                {selectedActivities.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Activities ({selectedActivities.length})
                    </span>
                    <span>{formatPrice(getActivitiesTotal())}</span>
                  </div>
                )}

                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-ocean-600">
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
