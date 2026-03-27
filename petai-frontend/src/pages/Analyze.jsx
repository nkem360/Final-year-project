/**
 * Analyze page
 * ------------
 * The core page. User enters symptoms → calls POST /health/analyse →
 * displays the full structured result.
 *
 * Pipeline (mirrors backend):
 *   1. User selects pet (from sidebar / PetContext)
 *   2. User types symptoms → clicks Analyse
 *   3. POST /health/analyse → HealthRecordResponse
 *   4. EmergencyAlert shown if record.is_emergency === true
 *   5. ResultsPanel shows all fields from the record
 */

import { useState } from "react";
import { usePets }   from "../context/PetContext";
import { healthApi } from "../services/api";

import SymptomInput   from "../components/SymptomInput";
import EmergencyAlert from "../components/EmergencyAlert";
import ResultsPanel   from "../components/ResultsPanel";

export default function Analyze() {
  const { selectedPet } = usePets();

  const [record, setRecord]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleAnalyze = async (symptomsText) => {
    if (!selectedPet) return;

    setLoading(true);
    setError(null);
    setRecord(null);

    try {
      const result = await healthApi.analyse({
        pet_id: selectedPet.id,
        symptoms_text: symptomsText,
      });
      setRecord(result);
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">AI Symptom Check</h1>
        <p className="text-gray-500 text-sm mt-1">
          Describe your pet's symptoms and our AI will analyse them using
          veterinary knowledge.
        </p>
      </div>

      {/* Symptom input — always visible */}
      <SymptomInput onAnalyze={handleAnalyze} loading={loading} />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Analysing symptoms…</p>
          <p className="text-gray-400 text-xs mt-1">
            Running emergency check → knowledge retrieval → AI analysis
          </p>
        </div>
      )}

      {/* Results */}
      {record && !loading && (
        <>
          {/* Emergency banner driven by backend flag */}
          <EmergencyAlert
            isEmergency={record.is_emergency}
            message={record.emergency_message}
          />

          {/* Full results */}
          <ResultsPanel record={record} petId={selectedPet?.id} />
        </>
      )}
    </div>
  );
}
