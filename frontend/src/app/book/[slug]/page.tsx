// ================================
// PUBLIC BOOKING PAGE
// This is the page customers see when they click "Book Now"
// on a surf company's landing page.
//
// URL: /book/[slug] (e.g., /book/bali-surf-camp)
//
// FLOW:
// 1. Customer selects check-in and check-out dates
// 2. System shows available rooms for those dates
// 3. Customer picks a room
// 4. Customer optionally picks a surf package
// 5. Customer fills in their details
// 6. Customer submits the booking
// ================================

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { companyApi, roomApi, packageApi, bookingApi } from "@/lib/api";
import { formatPrice, calculateNights } from "@/lib/helpers";
import { Company, Room, SurfPackage } from "@/types";

export default function BookingPage() {
  // Get the company slug from the URL
  const params = useParams();
  const slug = params.slug as string;

  // ================================
  // STATE
  // We track where the customer is in the booking process
  // using a "step" variable (1, 2, 3, or 4).
  // ================================
  const [step, setStep] = useState(1); // Current step (1-4)
  const [company, setCompany] = useState<Company | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [packages, setPackages] = useState<SurfPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Date selection (Step 1)
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  // Room selection (Step 2)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Package selection (Step 3)
  const [selectedPackage, setSelectedPackage] = useState<SurfPackage | null>(
    null
  );

  // Customer info (Step 4)
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  // ================================
  // LOAD COMPANY DATA
  // When the page loads, fetch the company info.
  // ================================
  useEffect(() => {
    async function loadCompany() {
      try {
        const data = await companyApi.getBySlug(slug);
        setCompany(data.company);

        // Also load packages for this company
        const pkgData = await packageApi.getForCompany(data.company._id);
        setPackages(pkgData.packages);
      } catch (err: any) {
        setError("Company not found.");
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, [slug]);

  // ================================
  // STEP 1: SEARCH AVAILABLE ROOMS
  // When customer picks dates, we fetch available rooms.
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
      setRooms(data.rooms);

      // Filter rooms by guest capacity
      const suitableRooms = data.rooms.filter(
        (room: Room) => room.capacity >= guests
      );
      setRooms(suitableRooms);

      // Move to step 2
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to search rooms.");
    } finally {
      setLoading(false);
    }
  }

  // ================================
  // STEP 4: SUBMIT BOOKING
  // Send all the booking data to the API.
  // ================================
  async function submitBooking() {
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await bookingApi.create({
        companyId: company!._id,
        roomId: selectedRoom!._id,
        packageId: selectedPackage?._id || null,
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
  // PRICE CALCULATION
  // Calculate and display the total price.
  // ================================
  function getTotalPrice(): number {
    if (!selectedRoom || !checkIn || !checkOut) return 0;

    const nights = calculateNights(checkIn, checkOut);
    const roomTotal = selectedRoom.pricePerNight * nights;
    const packageTotal = selectedPackage
      ? selectedPackage.pricePerPerson * guests
      : 0;

    return roomTotal + packageTotal;
  }

  // ================================
  // LOADING STATE
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

  // ================================
  // COMPANY NOT FOUND
  // ================================
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
  // SUCCESS STATE
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
        <div className="flex items-center gap-2 mb-8">
          {["Dates", "Room", "Package", "Details"].map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step > index + 1
                    ? "bg-green-500 text-white"
                    : step === index + 1
                    ? "bg-ocean-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > index + 1 ? "✓" : index + 1}
              </div>
              <span
                className={`text-sm ${
                  step === index + 1
                    ? "font-medium text-gray-900"
                    : "text-gray-500"
                }`}
              >
                {label}
              </span>
              {index < 3 && (
                <div className="w-12 h-px bg-gray-300 mx-1"></div>
              )}
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* ================================
            STEP 1: SELECT DATES
            ================================ */}
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

            {/* Show nights count */}
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

        {/* ================================
            STEP 2: SELECT ROOM
            ================================ */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Choose a Room</h2>
              <button
                onClick={() => setStep(1)}
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
                <button
                  onClick={() => setStep(1)}
                  className="btn-primary mt-4"
                >
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
                    {/* Amenities */}
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
                <button onClick={() => setStep(3)} className="btn-primary px-8">
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================
            STEP 3: SELECT PACKAGE (OPTIONAL)
            ================================ */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Add a Surf Package{" "}
                <span className="text-gray-400 text-sm font-normal">
                  (optional)
                </span>
              </h2>
              <button
                onClick={() => setStep(2)}
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
                  <p className="text-gray-600 text-sm mt-2">
                    {pkg.description}
                  </p>
                  {/* What's included */}
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
                Total:{" "}
                <strong className="text-ocean-600">
                  {formatPrice(getTotalPrice())}
                </strong>
              </p>
              <button onClick={() => setStep(4)} className="btn-primary px-8">
                {selectedPackage ? "Continue" : "Skip — Just the Room"}
              </button>
            </div>
          </div>
        )}

        {/* ================================
            STEP 4: CUSTOMER DETAILS
            ================================ */}
        {step === 4 && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Customer form */}
            <div className="md:col-span-2 card">
              <h2 className="text-xl font-semibold mb-4">Your Details</h2>

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

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(3)}
                  className="btn-secondary"
                >
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

            {/* Order Summary */}
            <div className="card h-fit">
              <h3 className="font-semibold mb-4">Booking Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Room</span>
                  <span className="font-medium">{selectedRoom?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Check-in</span>
                  <span>{checkIn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Check-out</span>
                  <span>{checkOut}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nights</span>
                  <span>{calculateNights(checkIn, checkOut)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Guests</span>
                  <span>{guests}</span>
                </div>
                {selectedPackage && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Package</span>
                    <span>{selectedPackage.name}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-500">Room cost</span>
                  <span>
                    {formatPrice(
                      (selectedRoom?.pricePerNight || 0) *
                        calculateNights(checkIn, checkOut)
                    )}
                  </span>
                </div>
                {selectedPackage && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Package</span>
                    <span>
                      {formatPrice(selectedPackage.pricePerPerson * guests)}
                    </span>
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
