export default function Sidebar({ setPage }) {
  return (
    <div className="w-64 h-screen bg-emerald-700 text-white p-6">
      <h1 className="text-2xl font-bold mb-8">🐾 PetAI</h1>

      <button
        onClick={() => setPage("dashboard")}
        className="block w-full text-left mb-4 hover:bg-emerald-600 p-2 rounded"
      >
        Dashboard
      </button>

      <button
        onClick={() => setPage("analyze")}
        className="block w-full text-left hover:bg-emerald-600 p-2 rounded"
      >
        AI Symptom Check
      </button>
    </div>
  );
}