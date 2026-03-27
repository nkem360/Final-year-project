/**
 * Dashboard page
 * --------------
 * Shows a summary for the selected pet:
 *  - Pet profile card
 *  - Total AI checks count
 *  - Emergency alerts count
 *  - Last 3 health records (recent activity)
 *
 * Data comes from GET /health/summary/{petId}
 */

import { useEffect, useState } from "react";
import { usePets } from "../context/PetContext";
import { healthApi } from "../services/api";
import PetProfile    from "../components/PetProfile";
import LoadingSpinner from "../components/LoadingSpinner";

const urgencyColour = {
  low:       "bg-green-100 text-green-700",
  moderate:  "bg-yellow-100 text-yellow-700",
  high:      "bg-orange-100 text-orange-700",
  emergency: "bg-red-100 text-red-700",
};

export default function Dashboard({ setPage }) {
  const { selectedPet } = usePets();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!selectedPet) return;

    setLoading(true);
    setError(null);

    healthApi
      .getSummary(selectedPet.id)
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedPet]);

  const emergencyCount =
    summary?.recent_records?.filter((r) => r.is_emergency).length ?? 0;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Pet Dashboard</h1>

      {/* Stat grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Pet profile card */}
        <PetProfile onAddPet={() => setPage("add-pet")} />

        {/* Total AI checks */}
        <div className="bg-white p-6 rounded-xl shadow flex flex-col justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total AI Checks</p>
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-4xl font-bold text-emerald-600 mt-1">
                {summary?.total_records ?? "–"}
              </p>
            )}
          </div>
          <button
            onClick={() => setPage("history")}
            className="mt-4 text-xs text-emerald-600 hover:underline text-left"
          >
            View full history →
          </button>
        </div>

        {/* Emergency alerts */}
        <div className="bg-white p-6 rounded-xl shadow flex flex-col justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Emergency Alerts</p>
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p
                className={`text-4xl font-bold mt-1 ${
                  emergencyCount > 0 ? "text-red-600" : "text-gray-400"
                }`}
              >
                {summary ? emergencyCount : "–"}
              </p>
            )}
          </div>
          {emergencyCount > 0 && (
            <p className="text-xs text-red-500 mt-2">
              ⚠️ Contact your vet if unresolved
            </p>
          )}
        </div>
      </div>

      {/* No pet selected */}
      {!selectedPet && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
          <p className="text-lg">Select or add a pet to see their health dashboard.</p>
          <button
            onClick={() => setPage("add-pet")}
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors text-sm"
          >
            ➕ Add a Pet
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Recent activity */}
      {selectedPet && !loading && summary && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Recent Activity</h2>

          {/* Common symptoms */}
          {summary.most_common_symptoms?.length > 0 && (
            <div className="bg-white p-4 rounded-xl shadow mb-4">
              <p className="text-sm text-gray-500 mb-2 font-medium">Common Symptoms Reported</p>
              <div className="flex flex-wrap gap-2">
                {summary.most_common_symptoms.map((s, i) => (
                  <span
                    key={i}
                    className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1 rounded-full border border-emerald-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent records list */}
          {summary.recent_records?.length > 0 ? (
            <div className="space-y-3">
              {summary.recent_records.slice(0, 3).map((record) => (
                <div
                  key={record.id}
                  className="bg-white p-4 rounded-xl shadow flex items-start gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{record.symptoms_text}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(record.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                      urgencyColour[record.urgency_level] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {record.urgency_level}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400">
              <p>No health checks yet for {selectedPet.name}.</p>
              <button
                onClick={() => setPage("analyze")}
                className="mt-3 text-emerald-600 text-sm hover:underline"
              >
                Run your first symptom check →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
