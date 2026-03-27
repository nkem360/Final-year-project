/**
 * ResultsPanel
 * ------------
 * Displays the full structured response from POST /health/analyse.
 *
 * Expected `record` shape (mirrors backend HealthRecordResponse):
 * {
 *   possible_conditions: [{ name, description, likelihood }],
 *   urgency_level: "low" | "moderate" | "high" | "emergency",
 *   recommendations: string[],
 *   home_care_tips: string[],
 *   when_to_see_vet: string,
 *   ai_summary: string,
 *   confidence_score: number (0–1),
 *   disclaimer: string,
 *   is_emergency: boolean,
 *   emergency_message: string | null,
 * }
 */
import FeedbackWidget from "./FeedbackWidget";

const urgencyConfig = {
  low:       { colour: "bg-green-100 text-green-800 border-green-300",  label: "Low",       icon: "✅" },
  moderate:  { colour: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "Moderate", icon: "⚠️" },
  high:      { colour: "bg-orange-100 text-orange-800 border-orange-300", label: "High",     icon: "🔶" },
  emergency: { colour: "bg-red-100 text-red-800 border-red-300",        label: "Emergency", icon: "🚨" },
};

const likelihoodColour = {
  high:     "bg-red-50 text-red-700 border border-red-200",
  moderate: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  low:      "bg-gray-50 text-gray-600 border border-gray-200",
};

export default function ResultsPanel({ record, petId }) {
  if (!record) return null;

  const urgency = urgencyConfig[record.urgency_level] ?? urgencyConfig.moderate;
  const confidence = record.confidence_score
    ? Math.round(record.confidence_score * 100)
    : null;

  return (
    <div className="space-y-4">
      {/* Header row: urgency badge + confidence */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">AI Analysis Results</h2>
        <div className="flex items-center gap-3">
          {confidence !== null && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {confidence}% confidence
            </span>
          )}
          <span
            className={`text-sm font-semibold px-3 py-1 rounded-full border ${urgency.colour}`}
          >
            {urgency.icon} {urgency.label} urgency
          </span>
        </div>
      </div>

      {/* AI summary */}
      {record.ai_summary && (
        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Summary
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed">{record.ai_summary}</p>
        </div>
      )}

      {/* Possible conditions */}
      {record.possible_conditions?.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Possible Conditions
          </h3>
          <div className="space-y-3">
            {record.possible_conditions.map((c, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${
                    likelihoodColour[c.likelihood] ?? likelihoodColour.low
                  }`}
                >
                  {c.likelihood}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                  {c.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column: recommendations + home care */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recommendations */}
        {record.recommendations?.length > 0 && (
          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Recommendations
            </h3>
            <ul className="space-y-2">
              {record.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-emerald-500 flex-shrink-0 mt-0.5">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Home care tips */}
        {record.home_care_tips?.length > 0 && (
          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Home Care Tips
            </h3>
            <ul className="space-y-2">
              {record.home_care_tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-400 flex-shrink-0 mt-0.5">•</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* When to see vet */}
      {record.when_to_see_vet && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-blue-700 mb-1">
            🏥 When to See a Vet
          </h3>
          <p className="text-sm text-blue-700">{record.when_to_see_vet}</p>
        </div>
      )}

      {/* Feedback widget */}
      {record.id && petId && (
        <FeedbackWidget
          petId={petId}
          recordId={record.id}
          currentFeedback={record.was_helpful}
        />
      )}

      {/* Disclaimer */}
      {record.disclaimer && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 text-center">
          {record.disclaimer}
        </div>
      )}
    </div>
  );
}
