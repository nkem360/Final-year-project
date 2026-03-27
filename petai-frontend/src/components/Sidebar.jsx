import { usePets } from "../context/PetContext";

const navItems = [
  { id: "dashboard", label: "Dashboard",        icon: "🏠" },
  { id: "analyze",   label: "AI Symptom Check", icon: "🔍" },
  { id: "history",   label: "Health History",   icon: "📋" },
];

export default function Sidebar({ page, setPage }) {
  const { pets, selectedPet, setSelectedPet, speciesEmoji, loadingPets } = usePets();

  return (
    <aside className="w-64 min-h-screen bg-emerald-700 text-white flex flex-col">
      {/* Brand */}
      <div className="p-6 border-b border-emerald-600">
        <h1 className="text-2xl font-bold">🐾 PetAI</h1>
        <p className="text-emerald-300 text-xs mt-1">Pet Health Assistant</p>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
              page === item.id
                ? "bg-emerald-800 text-white"
                : "hover:bg-emerald-600 text-emerald-100"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Pet Switcher */}
      <div className="p-4 border-t border-emerald-600">
        <p className="text-emerald-300 text-xs uppercase tracking-wide mb-2 font-semibold">
          My Pets
        </p>

        {loadingPets ? (
          <p className="text-emerald-300 text-sm">Loading…</p>
        ) : pets.length === 0 ? (
          <p className="text-emerald-300 text-xs">No pets yet.</p>
        ) : (
          <div className="space-y-1">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => setSelectedPet(pet)}
                className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedPet?.id === pet.id
                    ? "bg-emerald-800 text-white font-semibold"
                    : "hover:bg-emerald-600 text-emerald-100"
                }`}
              >
                <span>{speciesEmoji(pet.species)}</span>
                <span className="truncate">{pet.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Add Pet shortcut */}
        <button
          onClick={() => setPage("add-pet")}
          className="mt-3 flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-sm text-emerald-300 hover:text-white hover:bg-emerald-600 transition-colors"
        >
          <span>➕</span>
          Add a pet
        </button>
      </div>
    </aside>
  );
}
