// ================================
// ROOMS PAGE (Dashboard)
// Manage rooms for the company.
// Admin/Manager can create, edit, and delete rooms.
// ================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { roomApi } from "@/lib/api";
import { formatPrice } from "@/lib/helpers";
import { Room } from "@/types";

export default function RoomsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "double" as Room["type"],
    capacity: 2,
    pricePerNight: 0,
    amenities: "",
  });

  // Load rooms
  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const data = await roomApi.getAll();
      setRooms(data.rooms);
    } catch (error) {
      console.error("Error loading rooms:", error);
    } finally {
      setLoading(false);
    }
  }

  // Open form to create a new room
  function openCreateForm() {
    setEditingRoom(null);
    setForm({
      name: "",
      description: "",
      type: "double",
      capacity: 2,
      pricePerNight: 0,
      amenities: "",
    });
    setShowForm(true);
  }

  // Open form to edit an existing room
  function openEditForm(room: Room) {
    setEditingRoom(room);
    setForm({
      name: room.name,
      description: room.description,
      type: room.type,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight / 100, // Convert cents to dollars for the form
      amenities: room.amenities.join(", "),
    });
    setShowForm(true);
  }

  // Save room (create or update)
  async function handleSave() {
    try {
      const roomData = {
        name: form.name,
        description: form.description,
        type: form.type,
        capacity: form.capacity,
        pricePerNight: Math.round(form.pricePerNight * 100), // Convert dollars to cents
        amenities: form.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      };

      if (editingRoom) {
        await roomApi.update(editingRoom._id, roomData);
      } else {
        await roomApi.create(roomData);
      }

      setShowForm(false);
      loadRooms(); // Refresh the list
    } catch (error) {
      console.error("Error saving room:", error);
    }
  }

  // Delete room (soft delete)
  async function handleDelete(roomId: string) {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      await roomApi.delete(roomId);
      loadRooms();
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Rooms</h1>
        {canEdit && (
          <button onClick={openCreateForm} className="btn-primary">
            + Add Room
          </button>
        )}
      </div>

      {/* ================================
          ROOM FORM (Create/Edit)
          ================================ */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingRoom ? "Edit Room" : "New Room"}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Name
              </label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Ocean View Suite"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                className="input"
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as Room["type"] })
                }
              >
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="suite">Suite</option>
                <option value="dorm">Dorm</option>
                <option value="bungalow">Bungalow</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity (max guests)
              </label>
              <input
                type="number"
                className="input"
                value={form.capacity}
                onChange={(e) =>
                  setForm({ ...form, capacity: Number(e.target.value) })
                }
                min={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Night ($)
              </label>
              <input
                type="number"
                className="input"
                value={form.pricePerNight}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pricePerNight: Number(e.target.value),
                  })
                }
                min={0}
                step={0.01}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="input"
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Describe the room..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amenities (comma-separated)
              </label>
              <input
                type="text"
                className="input"
                value={form.amenities}
                onChange={(e) =>
                  setForm({ ...form, amenities: e.target.value })
                }
                placeholder="e.g., wifi, ac, ocean-view, balcony"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} className="btn-primary">
              {editingRoom ? "Save Changes" : "Create Room"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ================================
          ROOMS LIST
          ================================ */}
      {loading ? (
        <p className="text-gray-500">Loading rooms...</p>
      ) : rooms.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🏠</div>
          <p className="text-gray-500">No rooms yet. Add your first room!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div key={room._id} className="card">
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

              <p className="text-gray-600 text-sm mt-2">{room.description}</p>

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

              {/* Status badge */}
              <div className="mt-3">
                <span
                  className={`badge ${
                    room.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {room.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Edit/Delete buttons */}
              {canEdit && (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => openEditForm(room)}
                    className="text-sm text-ocean-600 hover:underline"
                  >
                    Edit
                  </button>
                  {user?.role === "admin" && (
                    <button
                      onClick={() => handleDelete(room._id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
