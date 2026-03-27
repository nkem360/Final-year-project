/**
 * EmergencyAlert
 * --------------
 * Driven entirely by the backend response field `is_emergency`.
 * The backend already ran its own keyword rules (vet_rules.py), so we
 * trust its verdict instead of re-implementing keyword detection here.
 *
 * Props:
 *  - isEmergency: boolean (from record.is_emergency)
 *  - message:     string  (from record.emergency_message, may be null)
 */
export default function EmergencyAlert({ isEmergency, message }) {
  if (!isEmergency) return null;

  return (
    <div className="p-5 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-sm animate-pulse-once">
      <div className="flex items-start gap-4">
        <span className="text-3xl flex-shrink-0">🚨</span>
        <div>
          <h3 className="text-lg font-bold text-red-700 mb-1">
            Emergency Detected
          </h3>
          <p className="text-red-700 text-sm mb-3">
            {message ||
              "Your pet may be experiencing a life-threatening situation."}
          </p>
          <div className="bg-red-100 border border-red-300 rounded-lg px-4 py-2 text-red-800 text-sm font-semibold">
            📞 Contact an emergency veterinary clinic IMMEDIATELY
          </div>
        </div>
      </div>
    </div>
  );
}
