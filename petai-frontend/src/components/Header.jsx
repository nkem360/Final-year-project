import { useAuth } from "../context/AuthContext";

export default function Header({ language, setLanguage, setPage }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // AuthContext sets user → null → App.jsx renders Login page automatically
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
      {/* Disclaimer */}
      <p className="text-amber-600 text-sm font-medium flex items-center gap-1">
        <span>⚠️</span>
        AI suggestions only — Not a veterinary diagnosis
      </p>

      {/* Right: language + user menu */}
      <div className="flex items-center gap-4">
        {/* Language selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border border-gray-300 rounded-lg text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="en">🇬🇧 English</option>
          <option value="fr">🇫🇷 French</option>
          <option value="cr">🌴 Creole</option>
        </select>

        {/* User info + logout */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-700">{user.username}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {user.username?.[0]?.toUpperCase() ?? "U"}
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors border border-gray-300 hover:border-red-300 px-2 py-1 rounded-lg"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
