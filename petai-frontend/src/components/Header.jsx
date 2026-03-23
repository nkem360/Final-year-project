export default function Header({ language, setLanguage }) {
  return (
    <div className="bg-white shadow p-4 flex justify-between">
      <p className="text-red-600 text-sm">
        ⚠️ AI suggestions only — Not a veterinary diagnosis
      </p>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="border p-2 rounded"
      >
        <option value="en">English</option>
        <option value="fr">French</option>
        <option value="cr">Creole</option>
      </select>
    </div>
  );
}