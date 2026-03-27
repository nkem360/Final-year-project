/**
 * FeedbackWidget
 * --------------
 * Lets the user rate whether an AI analysis was helpful.
 * Calls POST /health/records/{petId}/{recordId}/feedback
 */

import { useState } from "react";
import { healthApi } from "../services/api";

export default function FeedbackWidget({ petId, recordId, currentFeedback }) {
  const [submitted, setSubmitted] = useState(currentFeedback !== null && currentFeedback !== undefined);
  const [value, setValue]         = useState(currentFeedback);
  const [note, setNote]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  if (submitted) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3 text-sm text-gray-500">
        <span className="text-lg">{value ? "👍" : "👎"}</span>
        <span>
          Thanks for your feedback! You rated this analysis as{" "}
          <strong>{value ? "helpful" : "not helpful"}</strong>.
        </span>
      </div>
    );
  }

  const handleSubmit = async (wasHelpful) => {
    setLoading(true);
    setError(null);
    try {
      await healthApi.submitFeedback(petId, recordId, {
        was_helpful: wasHelpful,
        user_feedback: note.trim() || undefined,
      });
      setValue(wasHelpful);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-medium text-gray-600 mb-3">
        Was this analysis helpful?
      </p>

      <textarea
        className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3 resize-none"
        rows={2}
        placeholder="Optional: leave a comment (e.g. vet confirmed diagnosis)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={loading}
      />

      <div className="flex gap-3">
        <button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-800 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          👍 Yes, helpful
        </button>
        <button
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-800 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          👎 Not helpful
        </button>
      </div>

      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  );
}
