import { useState } from "react";
import { usePets } from "../context/PetContext";

export default function SymptomInput({ onAnalyze, loading }) {
  const [symptoms, setSymptoms] = useState("");
  const { selectedPet, speciesEmoji } = usePets();

  const handleSubmit = () => {
    if (!symptoms.trim()) return;
    if (!selectedPet) return;
    onAnalyze(symptoms.trim());
  };

  const placeholder =
    selectedPet
      ? `Describe ${selectedPet.name}'s symptoms… e.g. "limping on front leg for 2 days and not eating"`
      : "Select a pet first, then describe their symptoms…";

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Describe the Symptoms</h2>
      <p className="text-sm text-gray-500 mb-4">
        Be as detailed as possible — duration, severity, any changes in behaviour.
      </p>

      {/* Selected pet indicator */}
      {selectedPet && (
        <div className="flex items-center gap-2 mb-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <span>{speciesEmoji(selectedPet.species)}</span>
          <span className="text-sm font-medium text-emerald-700">
            Analysing for: {selectedPet.name}
          </span>
        </div>
      )}

      {!selectedPet && (
        <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700">
          ⚠️ No pet selected. Please select or add a pet first.
        </div>
      )}

      <textarea
        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        rows={5}
        placeholder={placeholder}
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
        disabled={loading || !selectedPet}
      />

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-400">{symptoms.length} characters</p>

        <button
          onClick={handleSubmit}
          disabled={loading || !symptoms.trim() || !selectedPet}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
              Analysing…
            </>
          ) : (
            <>🔍 Analyse Symptoms</>
          )}
        </button>
      </div>
    </div>
  );
}
