import { usePets } from "../context/PetContext";

export default function PetProfile({ onAddPet }) {
  const { selectedPet, speciesEmoji } = usePets();

  if (!selectedPet) {
    return (
      <div className="bg-white p-6 rounded-xl shadow border border-dashed border-gray-300 text-center">
        <p className="text-gray-400 text-sm mb-3">No pet selected</p>
        <button
          onClick={onAddPet}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          ➕ Add Your First Pet
        </button>
      </div>
    );
  }

  const emoji = speciesEmoji(selectedPet.species);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-3xl">
          {emoji}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{selectedPet.name}</h2>
          <p className="text-sm text-emerald-600 capitalize font-medium">{selectedPet.species}</p>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        {selectedPet.breed && (
          <div>
            <span className="text-gray-400">Breed</span>
            <p className="font-medium text-gray-700">{selectedPet.breed}</p>
          </div>
        )}
        {selectedPet.age_years != null && (
          <div>
            <span className="text-gray-400">Age</span>
            <p className="font-medium text-gray-700">{selectedPet.age_years} yrs</p>
          </div>
        )}
        {selectedPet.weight_kg != null && (
          <div>
            <span className="text-gray-400">Weight</span>
            <p className="font-medium text-gray-700">{selectedPet.weight_kg} kg</p>
          </div>
        )}
        {selectedPet.gender && (
          <div>
            <span className="text-gray-400">Gender</span>
            <p className="font-medium text-gray-700 capitalize">
              {selectedPet.gender}
              {selectedPet.is_neutered ? " (neutered)" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Medical notes */}
      {selectedPet.medical_notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Medical notes</p>
          <p className="text-sm text-gray-600">{selectedPet.medical_notes}</p>
        </div>
      )}
    </div>
  );
}
