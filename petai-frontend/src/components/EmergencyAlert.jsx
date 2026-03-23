export default function EmergencyAlert({ symptoms }) {
  const emergencyWords = [
    "seizure",
    "seizures",
    "convulsion",
    "unconscious",
    "collapse",
    "bleeding",
    "heavy bleeding",
    "difficulty breathing",
    "can't breathe",
    "choking",
    "poison",
    "swallowed",
    "hit by car",
  ];

  const isEmergency =
    symptoms &&
    emergencyWords.some((word) =>
      symptoms.toLowerCase().includes(word.toLowerCase())
    );

  if (!isEmergency) return null;

  return (
    <div className="mt-6 p-6 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-sm">
      <div className="flex items-start gap-4">
        <span className="text-3xl">⚠️</span>
        <div>
          <h3 className="text-lg font-bold text-red-700 mb-1">
            Possible Emergency Detected
          </h3>
          <p className="text-red-700">
            Some symptoms may be serious.
            <br />
            <strong>
              Please contact a veterinarian or emergency clinic immediately.
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}