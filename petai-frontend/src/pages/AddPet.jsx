/**
 * AddPet page
 * -----------
 * Form to create a new pet via POST /pets/
 * After creation, PetContext adds it to state and auto-selects it,
 * then onDone() is called to navigate back to Dashboard.
 */

import { useState } from "react";
import { usePets } from "../context/PetContext";

const SPECIES = ["dog", "cat", "bird", "rabbit", "hamster", "fish", "reptile", "other"];

const speciesEmojis = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰",
  hamster: "🐹", fish: "🐟", reptile: "🦎", other: "🐾",
};

export default function AddPet({ onDone }) {
  const { addPet } = usePets();

  const [form, setForm] = useState({
    name:          "",
    species:       "dog",
    breed:         "",
    age_years:     "",
    weight_kg:     "",
    gender:        "",
    is_neutered:   false,
    color:         "",
    medical_notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Pet name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    // Build payload — only send non-empty optional fields
    const payload = { name: form.name.trim(), species: form.species };
    if (form.breed.trim())         payload.breed         = form.breed.trim();
    if (form.age_years !== "")     payload.age_years     = parseFloat(form.age_years);
    if (form.weight_kg !== "")     payload.weight_kg     = parseFloat(form.weight_kg);
    if (form.gender)               payload.gender        = form.gender;
    payload.is_neutered = form.is_neutered;
    if (form.color.trim())         payload.color         = form.color.trim();
    if (form.medical_notes.trim()) payload.medical_notes = form.medical_notes.trim();

    try {
      await addPet(payload);
      onDone(); // navigate back to dashboard
    } catch (err) {
      setError(err.message || "Failed to add pet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Add a Pet</h1>
        <p className="text-gray-500 text-sm mt-1">
          Add your pet's profile so AI analysis can be personalised to them.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pet Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Buddy"
            />
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Species <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SPECIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, species: s }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${
                    form.species === s
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold"
                      : "border-gray-200 hover:border-emerald-300 text-gray-600"
                  }`}
                >
                  <span className="text-xl">{speciesEmojis[s]}</span>
                  <span className="capitalize">{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Breed + Age side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
              <input
                type="text"
                name="breed"
                value={form.breed}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Labrador"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
              <input
                type="number"
                name="age_years"
                value={form.age_years}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 3.5"
              />
            </div>
          </div>

          {/* Weight + Gender side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                name="weight_kg"
                value={form.weight_kg}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 10.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* Colour */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Colour / Markings</label>
            <input
              type="text"
              name="color"
              value={form.color}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. golden, black and white"
            />
          </div>

          {/* Neutered checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_neutered"
              id="is_neutered"
              checked={form.is_neutered}
              onChange={handleChange}
              className="w-4 h-4 accent-emerald-600"
            />
            <label htmlFor="is_neutered" className="text-sm text-gray-700">
              Neutered / Spayed
            </label>
          </div>

          {/* Medical notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Notes
            </label>
            <textarea
              name="medical_notes"
              value={form.medical_notes}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Known allergies, previous conditions, medications…"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {loading ? "Saving…" : "Add Pet"}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="px-4 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
