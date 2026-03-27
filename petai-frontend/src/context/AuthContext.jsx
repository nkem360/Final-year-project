/**
 * AuthContext
 * -----------
 * Provides authentication state and actions to the entire app.
 *
 * On mount, if an access_token exists in localStorage, we validate it by
 * calling GET /users/me. If the call succeeds the user is considered logged in.
 * If it fails (expired / invalid) tokens are cleared and the login page appears.
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, clearTokens, getAccessToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while we verify the stored token

  // ── On mount: validate any stored token ──────────────────────────────────────
  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .getMe()
      .then((me) => setUser(me))
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Sign up a new account. Does NOT log the user in automatically. */
  const signup = useCallback(async ({ username, email, password }) => {
    return authApi.signup({ username, email, password });
  }, []);

  /** Login with email + password. Fetches profile on success. */
  const login = useCallback(async (email, password) => {
    await authApi.login(email, password);
    const me = await authApi.getMe();
    setUser(me);
    return me;
  }, []);

  /** Logout — revokes server-side token and clears local state. */
  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  /** Refresh the user profile (e.g. after an account update). */
  const refreshUser = useCallback(async () => {
    const me = await authApi.getMe();
    setUser(me);
    return me;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook for consuming auth state/actions in any component. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
