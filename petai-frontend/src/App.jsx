/**
 * App.jsx — Root component
 * -------------------------
 * Wraps the entire app in AuthProvider + PetProvider.
 * AppContent handles the two top-level states:
 *   • Not authenticated → Login / Signup pages
 *   • Authenticated     → Main app shell (Sidebar + Header + page router)
 */

import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PetProvider, usePets } from "./context/PetContext";

import Sidebar        from "./components/Sidebar";
import Header         from "./components/Header";
import LoadingSpinner from "./components/LoadingSpinner";

import Login       from "./pages/Login";
import Signup      from "./pages/Signup";
import Dashboard   from "./pages/Dashboard";
import Analyze     from "./pages/Analyze";
import HealthHistory from "./pages/HealthHistory";
import AddPet      from "./pages/AddPet";

// ── Inner app (requires auth) ─────────────────────────────────────────────────

function AuthenticatedApp() {
  const { fetchPets } = usePets();
  const [page, setPage]         = useState("dashboard");
  const [language, setLanguage] = useState("en");

  // Load pets once on mount
  useEffect(() => {
    fetchPets();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left navigation */}
      <Sidebar page={page} setPage={setPage} />

      {/* Right content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header language={language} setLanguage={setLanguage} setPage={setPage} />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {page === "dashboard" && <Dashboard setPage={setPage} />}
          {page === "analyze"   && <Analyze />}
          {page === "history"   && <HealthHistory />}
          {page === "add-pet"   && <AddPet onDone={() => setPage("dashboard")} />}
        </main>
      </div>
    </div>
  );
}

// ── Auth gate ─────────────────────────────────────────────────────────────────

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [authPage, setAuthPage] = useState("login");

  // While we're verifying the stored token, show a full-screen spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 text-sm">Loading PetAI…</p>
        </div>
      </div>
    );
  }

  // Not logged in → show auth pages
  if (!isAuthenticated) {
    return authPage === "login" ? (
      <Login onSwitchToSignup={() => setAuthPage("signup")} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthPage("login")} />
    );
  }

  // Logged in → show main app
  return <AuthenticatedApp />;
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <PetProvider>
        <AppContent />
      </PetProvider>
    </AuthProvider>
  );
}
