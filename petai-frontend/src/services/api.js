/**
 * API Service Layer
 * -----------------
 * Central client for all communication with the FastAPI backend.
 *
 * - When VITE_API_URL is set (production), requests go directly to that URL.
 * - In development, VITE_API_URL is empty and Vite's proxy forwards /api → http://localhost:8000
 *
 * Auth flow:
 *   1. Access token stored in localStorage → attached as Bearer header on every request.
 *   2. On 401 the client automatically attempts a token refresh (one retry).
 *   3. If refresh fails, tokens are cleared and the page reloads → user lands on Login.
 */

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

// ── Token helpers ──────────────────────────────────────────────────────────────

export const getAccessToken = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");

export const setTokens = (access, refresh) => {
  localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

// ── Token refresh (called automatically on 401) ───────────────────────────────

async function attemptTokenRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/users/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// ── Core request function ─────────────────────────────────────────────────────

/**
 * @param {string} method  - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} path    - Endpoint path (e.g. "/users/me")
 * @param {object} body    - Request body (JSON serialised automatically)
 * @param {boolean} retry  - Internal flag to prevent infinite refresh loops
 */
async function request(method, path, body = null, retry = true) {
  const headers = { "Content-Type": "application/json" };

  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body !== null) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

  // Auto-refresh on 401
  if (res.status === 401 && retry) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) return request(method, path, body, false); // one retry
    clearTokens();
    window.location.reload(); // redirect to login
    return;
  }

  // No content responses (204)
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));

  if (!res.ok) {
    const message =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
        ? data.detail.map((e) => e.msg).join(", ")
        : `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data;
}

// ── Auth endpoints ─────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * Create a new user account.
   * POST /users/signup
   */
  signup: ({ username, email, password }) =>
    request("POST", "/users/signup", { username, email, password }),

  /**
   * Login with email + password. Stores tokens in localStorage on success.
   * POST /users/login
   */
  login: async (email, password) => {
    const data = await request("POST", "/users/login", { email, password });
    if (data) setTokens(data.access_token, data.refresh_token);
    return data;
  },

  /**
   * Logout — revokes the refresh token server-side and clears local storage.
   * POST /users/logout
   */
  logout: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await request("POST", "/users/logout", {
        refresh_token: refreshToken,
      }).catch(() => {});
    }
    clearTokens();
  },

  /** GET /users/me */
  getMe: () => request("GET", "/users/me"),

  /** PUT /users/me/password */
  changePassword: (currentPassword, newPassword) =>
    request("PUT", "/users/me/password", {
      current_password: currentPassword,
      new_password: newPassword,
    }),

  /** DELETE /users/me */
  deleteAccount: () => request("DELETE", "/users/me"),
};

// ── Pet endpoints ──────────────────────────────────────────────────────────────

export const petsApi = {
  /** GET /pets/ — list all pets for the authenticated user */
  list: () => request("GET", "/pets/"),

  /** GET /pets/{id} */
  get: (id) => request("GET", `/pets/${id}`),

  /**
   * POST /pets/ — create a new pet
   * @param {{ name, species, breed?, age_years?, weight_kg?, gender?, is_neutered?, color?, medical_notes? }} petData
   */
  create: (petData) => request("POST", "/pets/", petData),

  /** PUT /pets/{id} — partial update */
  update: (id, petData) => request("PUT", `/pets/${id}`, petData),

  /** DELETE /pets/{id} */
  delete: (id) => request("DELETE", `/pets/${id}`),
};

// ── Health Analysis endpoints ──────────────────────────────────────────────────

export const healthApi = {
  /**
   * Submit symptoms for AI analysis.
   * POST /health/analyse
   * @param {{ pet_id: number, symptoms_text: string, image_url?: string }} data
   */
  analyse: (data) => request("POST", "/health/analyse", data),

  /**
   * GET /health/records/{petId} — paginated health history for a pet
   * @param {number} petId
   * @param {number} limit  - default 20
   * @param {number} offset - default 0
   */
  getRecords: (petId, limit = 20, offset = 0) =>
    request("GET", `/health/records/${petId}?limit=${limit}&offset=${offset}`),

  /** GET /health/records/{petId}/{recordId} */
  getRecord: (petId, recordId) =>
    request("GET", `/health/records/${petId}/${recordId}`),

  /**
   * POST /health/records/{petId}/{recordId}/feedback
   * @param {{ was_helpful: boolean, user_feedback?: string }} feedback
   */
  submitFeedback: (petId, recordId, feedback) =>
    request(
      "POST",
      `/health/records/${petId}/${recordId}/feedback`,
      feedback
    ),

  /** GET /health/summary/{petId} — stats + common symptoms */
  getSummary: (petId) => request("GET", `/health/summary/${petId}`),

  /** DELETE /health/records/{petId}/{recordId} */
  deleteRecord: (petId, recordId) =>
    request("DELETE", `/health/records/${petId}/${recordId}`),
};
