/**
 * HealthHistory page
 * ------------------
 * Lists all past health analysis records for the selected pet.
 * Uses GET /health/records/{petId} with pagination.
 * Clicking a record expands it to show the full analysis.
 */

import { useEffect, useState } from "react";
import { usePets }   from "../context/PetContext";
import { healthApi } from "../services/api";

import EmergencyAlert from "../components/EmergencyAlert";
import ResultsPanel   from "../components/ResultsPanel";
import LoadingSpinner from "../components/LoadingSpinner";

const urgencyConfig = {
  low:       { colour: "bg-green-100 text-green-700",   label: "Low" },
  moderate:  { colour: "bg-yellow-100 text-yellow-700", label: "Moderate" },
  high:      { colour: "bg-orange-100 text-orange-700", label: "High" },
  emergency: { colour: "bg-red-100 text-red-700",       label: "Emergency" },
};

const PAGE_SIZE = 10;

export default function HealthHistory() {
  const { selectedPet, speciesEmoji } = usePets();

  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [offset, setOffset]       = useState(0);
  const [hasMore, setHasMore]     = useState(false);
  const [expanded, setExpanded]   = useState(null); // record id that is expanded
  const [deleting, setDeleting]   = useState(null);

  // Fetch records whenever selectedPet or offset changes
  useEffect(() => {
    if (!selectedPet) return;

    setLoading(true);
    setError(null);

    healthApi
      .getRecords(selectedPet.id, PAGE_SIZE, offset)
      .then((data) => {
        setRecords((prev) => (offset === 0 ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedPet, offset]);

  // Reset when pet changes
  useEffect(() => {
    setRecords([]);
    setOffset(0);
    setExpanded(null);
  }, [selectedPet?.id]);

  const handleDelete = async (petId, recordId) => {
    if (!window.confirm("Delete this health record? This cannot be undone.")) return;
    setDeleting(recordId);
    try {
      await healthApi.deleteRecord(petId, recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      if (expanded === recordId) setExpanded(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  if (!selectedPet) {
    return (
      <div className="text-center text-gray-400 mt-16">
        <p className="text-lg">Select a pet to view their health history.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Health History</h1>
        <p className="text-gray-500 text-sm mt-1">
          {speciesEmoji(selectedPet.species)} {selectedPet.name} — all past symptom checks
        </p>
      </div>

      {/* Loading initial */}
      {loading && records.length === 0 && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && records.length === 0 && !error && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
          <p>No health checks found for {selectedPet.name}.</p>
        </div>
      )}

      {/* Records list */}
      {records.map((record) => {
        const urgency = urgencyConfig[record.urgency_level] ?? urgencyConfig.moderate;
        const isOpen  = expanded === record.id;

        return (
          <div key={record.id} className="bg-white rounded-xl shadow overflow-hidden">
            {/* Summary row */}
            <button
              className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(isOpen ? null : record.id)}
            >
              {/* Urgency dot */}
              <div className="flex-shrink-0 mt-1">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    record.urgency_level === "emergency"
                      ? "bg-red-500"
                      : record.urgency_level === "high"
                      ? "bg-orange-400"
                      : record.urgency_level === "moderate"
                      ? "bg-yellow-400"
                      : "bg-green-400"
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 font-medium truncate">
                  {record.symptoms_text}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(record.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${urgency.colour}`}
                >
                  {urgency.label}
                </span>
                {record.is_emergency && <span>🚨</span>}
                <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50">
                <EmergencyAlert
                  isEmergency={record.is_emergency}
                  message={record.emergency_message}
                />
                <ResultsPanel record={record} petId={selectedPet.id} />

                {/* Delete */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDelete(selectedPet.id, record.id)}
                    disabled={deleting === record.id}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50"
                  >
                    {deleting === record.id ? "Deleting…" : "Delete this record"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
            disabled={loading}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
