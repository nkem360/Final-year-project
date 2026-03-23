import { useState } from "react";

export default function SymptomInput({ onAnalyze }) {
  const [symptoms, setSymptoms] = useState("");

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-3">
        Enter Pet Symptoms
      </h2>

      <textarea
        className="w-full border p-3 rounded"
        rows="4"
        placeholder="My dog is limping and not eating..."
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
      />

      <button
        onClick={() => onAnalyze(symptoms)}
        className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded"
      >
        Analyze
      </button>
    </div>
  );
}