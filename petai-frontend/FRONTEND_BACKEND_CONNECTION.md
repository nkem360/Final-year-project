# Frontend ↔ Backend Connection Guide

This document explains in detail how the React frontend (`petai-frontend/`) connects to the FastAPI backend (`backend/`), covering every layer: HTTP transport, authentication, data flow, state management, and error handling.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Network Transport — Vite Proxy](#network-transport--vite-proxy)
3. [API Service Layer](#api-service-layer)
4. [Authentication Flow](#authentication-flow)
5. [State Management (Context)](#state-management-context)
6. [Page-by-Page Connection Map](#page-by-page-connection-map)
7. [Data Shape Mapping](#data-shape-mapping)
8. [Error Handling](#error-handling)
9. [Environment Configuration](#environment-configuration)
10. [Local Development Checklist](#local-development-checklist)

---

## Architecture Overview

```
Browser (React)
     │
     │  HTTP requests to /api/v1/*
     │
     ▼
Vite Dev Server (port 3000)
     │
     │  Proxy: /api → http://localhost:8000
     │
     ▼
FastAPI Backend (port 8000)
     │
     ├── PostgreSQL (data persistence)
     ├── FAISS vector store (vet knowledge)
     └── OpenAI GPT-4o (AI analysis)
```

In **development**, Vite acts as a transparent proxy so the browser never talks directly to port 8000 — it always talks to port 3000, which forwards API requests. This avoids CORS issues entirely during development.

In **production**, `VITE_API_URL` is set to the deployed backend URL (e.g. `https://api.mypetai.com`) and requests go there directly (CORS must be configured on the backend).

---

## Network Transport — Vite Proxy

**File:** `petai-frontend/vite.config.js`

```js
server: {
  port: 3000,
  proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
      secure: false,
    },
  },
},
```

**How it works:**
- Any request the frontend makes to `/api/v1/users/login` is intercepted by Vite.
- Vite forwards it to `http://localhost:8000/api/v1/users/login`.
- The response is passed back to the browser.
- From the browser's perspective, everything comes from `localhost:3000` — no cross-origin issues.

---

## API Service Layer

**File:** `petai-frontend/src/services/api.js`

This is the single point of contact between the React app and the backend. No component talks to `fetch()` directly — everything goes through this module.

### Base URL resolution

```js
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";
```

| Environment | `VITE_API_URL` | Effective base |
|---|---|---|
| Development | _(empty)_ | `/api/v1` → proxied by Vite to `http://localhost:8000/api/v1` |
| Production  | `https://api.mypetai.com` | `https://api.mypetai.com/api/v1` |

### Core `request()` function

```
request(method, path, body)
         │
         ├─ Attach Authorization: Bearer <access_token> header (from localStorage)
         │
         ├─ Call fetch()
         │
         ├─ If 401 → call attemptTokenRefresh()
         │     ├─ POST /users/refresh with refresh_token
         │     ├─ If success → store new tokens → retry original request (once)
         │     └─ If failure → clearTokens() → window.location.reload() → Login page
         │
         ├─ If 204 → return null
         │
         ├─ If !res.ok → parse error detail → throw Error(message)
         │
         └─ Return res.json()
```

### Exported API groups

| Export | Methods | Backend route group |
|---|---|---|
| `authApi` | signup, login, logout, getMe, changePassword, deleteAccount | `POST/GET/PUT/DELETE /users/*` |
| `petsApi` | list, get, create, update, delete | `GET/POST/PUT/DELETE /pets/*` |
| `healthApi` | analyse, getRecords, getRecord, submitFeedback, getSummary, deleteRecord | `POST/GET/DELETE /health/*` |

---

## Authentication Flow

### Login

```
User fills Login form
        │
        ▼
authApi.login(email, password)
        │   POST /users/login → { access_token, refresh_token, token_type }
        │
        ├─ setTokens() → localStorage.setItem("access_token", ...)
        │                 localStorage.setItem("refresh_token", ...)
        │
        ▼
authApi.getMe()
        │   GET /users/me → UserResponse
        │
        ▼
setUser(me)  [in AuthContext]
        │
        ▼
App.jsx re-renders → isAuthenticated = true → shows main app
```

### Token persistence across page refreshes

When the page loads, `AuthContext` runs this effect:

```js
useEffect(() => {
  const token = getAccessToken(); // read from localStorage
  if (!token) { setLoading(false); return; }

  authApi.getMe()            // validate the token is still alive
    .then(setUser)           // if ok → user is logged in
    .catch(() => {
      clearTokens();         // if expired → clear storage
      setUser(null);         // → Login page
    })
    .finally(() => setLoading(false));
}, []);
```

**Result:** If the user closes and reopens the tab, they remain logged in as long as the access token is valid (default: 60 minutes). The token refresh mechanism extends this automatically.

### Automatic token refresh

When any request returns `401 Unauthorized`:

```
401 received
     │
     ▼
attemptTokenRefresh()
     │   POST /users/refresh { refresh_token }
     │   → { access_token, refresh_token }  (old token is revoked server-side)
     │
     ├─ success → setTokens(new) → retry original request
     │
     └─ failure → clearTokens() → reload page → Login
```

This is transparent to components — they never know a refresh happened.

### Logout

```
User clicks "Sign out"
        │
        ▼
authApi.logout()
        │   POST /users/logout { refresh_token }  → server revokes token
        │   clearTokens()                          → remove from localStorage
        │
        ▼
setUser(null)  [in AuthContext]
        │
        ▼
App.jsx re-renders → isAuthenticated = false → Login page
```

---

## State Management (Context)

### AuthContext (`src/context/AuthContext.jsx`)

Provides authentication state and actions to the whole app.

| Value | Type | Description |
|---|---|---|
| `user` | object \| null | Current user (from `/users/me`) |
| `loading` | boolean | True while validating stored token on mount |
| `isAuthenticated` | boolean | `!!user` |
| `login(email, pw)` | function | Calls backend, stores tokens, sets user |
| `signup(data)` | function | Creates account (does not log in) |
| `logout()` | function | Revokes token, clears state |
| `refreshUser()` | function | Re-fetches user profile |

### PetContext (`src/context/PetContext.jsx`)

Manages the list of pets and the currently-selected pet.

| Value | Type | Description |
|---|---|---|
| `pets` | Pet[] | All pets for the logged-in user |
| `selectedPet` | Pet \| null | Currently selected pet (used by Analyze + Dashboard) |
| `setSelectedPet(pet)` | function | Change the selected pet |
| `loadingPets` | boolean | True while fetching |
| `fetchPets()` | function | Calls `GET /pets/` and populates state |
| `addPet(data)` | function | `POST /pets/` + updates local state |
| `updatePet(id, data)` | function | `PUT /pets/{id}` + updates local state |
| `deletePet(id)` | function | `DELETE /pets/{id}` + updates local state |
| `speciesEmoji(species)` | function | Returns emoji for display |

**Context tree:**
```
<AuthProvider>         ← wraps everything, provides user + auth actions
  <PetProvider>        ← wraps everything inside auth, provides pet list
    <AppContent />     ← reads both contexts
  </PetProvider>
</AuthProvider>
```

---

## Page-by-Page Connection Map

### Login page (`src/pages/Login.jsx`)

```
Form submit
    │
    ▼
useAuth().login(email, password)
    │   → authApi.login()  →  POST /users/login
    │   → authApi.getMe()  →  GET /users/me
    │
    ▼
AuthContext.user = UserResponse
    │
    ▼
App.jsx: isAuthenticated = true → AuthenticatedApp rendered
```

### Signup page (`src/pages/Signup.jsx`)

```
Form submit
    │
    ▼
useAuth().signup({ username, email, password })
    │   → authApi.signup()  →  POST /users/signup
    │
    ▼
Success screen → user clicks "Go to Sign In" → Login page
```

### Dashboard page (`src/pages/Dashboard.jsx`)

```
On mount (selectedPet changes)
    │
    ▼
healthApi.getSummary(selectedPet.id)
    │   →  GET /health/summary/{petId}
    │   →  { total_records, recent_records, most_common_symptoms }
    │
    ├─ Stat cards: total_records, emergency count
    ├─ Common symptoms: badge list
    └─ Recent activity: last 3 records with urgency + date
```

### Analyze page (`src/pages/Analyze.jsx`)

```
User types symptoms → clicks "Analyse Symptoms"
    │
    ▼
healthApi.analyse({ pet_id, symptoms_text })
    │   →  POST /health/analyse
    │
    │   Backend pipeline:
    │     1. Emergency keyword check (vet_rules.py)
    │     2. Query rewriting (GPT-4o-mini)
    │     3. FAISS knowledge retrieval (top 4 chunks)
    │     4. GPT-4o analysis
    │     5. Pydantic validation
    │     6. Saved to PostgreSQL
    │
    │   → HealthRecordResponse
    │
    ├─ record.is_emergency = true  → EmergencyAlert shown
    │
    └─ ResultsPanel renders:
         - possible_conditions  (name, description, likelihood)
         - urgency_level        (badge: low/moderate/high/emergency)
         - ai_summary
         - recommendations      (bullet list)
         - home_care_tips       (bullet list)
         - when_to_see_vet
         - confidence_score
         - disclaimer
         - FeedbackWidget       → POST /health/records/{id}/feedback
```

### Health History page (`src/pages/HealthHistory.jsx`)

```
On mount (selectedPet changes)
    │
    ▼
healthApi.getRecords(selectedPet.id, limit=10, offset=0)
    │   →  GET /health/records/{petId}?limit=10&offset=0
    │   →  HealthRecordResponse[]
    │
    ├─ List of records (summary rows)
    │
    ├─ Click row → expand → full ResultsPanel
    │
    ├─ "Load more" → offset += 10 → next page appended
    │
    └─ Delete → DELETE /health/records/{petId}/{recordId}
```

### AddPet page (`src/pages/AddPet.jsx`)

```
Form submit
    │
    ▼
usePets().addPet(payload)
    │   →  petsApi.create(payload)  →  POST /pets/
    │   →  PetResponse
    │
    ├─ PetContext: pets array updated, selectedPet = new pet
    │
    └─ onDone() → navigate to Dashboard
```

---

## Data Shape Mapping

### Symptom analysis request

| Frontend field | Backend field | Type |
|---|---|---|
| `pet_id` | `pet_id` | number |
| `symptoms_text` | `symptoms_text` | string |
| — | `image_url` | string \| null (optional, future) |

### Health record response (key fields displayed in ResultsPanel)

| Backend field | Displayed in |
|---|---|
| `possible_conditions[].name` | Condition card title |
| `possible_conditions[].description` | Condition card body |
| `possible_conditions[].likelihood` | Colour-coded badge (high/moderate/low) |
| `urgency_level` | Urgency badge top-right |
| `ai_summary` | Summary card |
| `recommendations[]` | Bullet list (left column) |
| `home_care_tips[]` | Bullet list (right column) |
| `when_to_see_vet` | Blue info box |
| `confidence_score` | "X% confidence" label |
| `is_emergency` | EmergencyAlert visibility |
| `emergency_message` | EmergencyAlert text |
| `disclaimer` | Grey footer text |
| `id` + `pet_id` | FeedbackWidget POST URL |

### Feedback request

| Frontend field | Backend field | Type |
|---|---|---|
| `was_helpful` | `was_helpful` | boolean |
| `user_feedback` | `user_feedback` | string \| undefined |

---

## Error Handling

### In the API service

The `request()` function throws a plain `Error` with a human-readable message extracted from the backend's `detail` field:

```js
// Backend returns: { "detail": "Pet not found" }
throw new Error("Pet not found");
```

For validation errors (422), multiple messages are joined:
```js
// Backend returns: { "detail": [{ "msg": "value is not a valid email" }] }
throw new Error("value is not a valid email");
```

### In components

All async calls are wrapped in `try/catch`:

```jsx
try {
  const result = await healthApi.analyse({ ... });
  setRecord(result);
} catch (err) {
  setError(err.message);  // shown in red error box
} finally {
  setLoading(false);
}
```

Each page has its own `error` state variable displayed as a red bordered box.

### Global 401 handling

Any `401` response (expired token) triggers an automatic refresh. If the refresh also fails, tokens are cleared and the page reloads — the user sees the Login page without any confusing error.

---

## Environment Configuration

### Frontend (`.env`)

```env
# Leave empty in development — Vite proxy handles routing to localhost:8000
VITE_API_URL=

# Example for production:
# VITE_API_URL=https://api.mypetai.com
```

### Backend (`.env`)

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_SERVER=localhost
POSTGRES_DB=pet_health_db

OPENAI_API_KEY=sk-...

JWT_SECRET_KEY=your-long-random-secret

CORS_ORIGINS=http://localhost:3000
```

> **Important:** `CORS_ORIGINS` in the backend must include the frontend origin. In development that's `http://localhost:3000`. In production, set it to your deployed frontend URL.

---

## Local Development Checklist

Follow these steps to run the full stack locally:

**1. Start the backend**

```bash
cd backend
cp .env.example .env       # fill in OPENAI_API_KEY and JWT_SECRET_KEY
docker-compose up --build  # starts PostgreSQL + FastAPI on port 8000
```

**2. Build the knowledge base** _(first time only)_

```bash
# Sign up, log in, then:
curl -X POST http://localhost:8000/api/v1/admin/ingest \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**3. Start the frontend**

```bash
cd petai-frontend
cp .env.example .env       # leave VITE_API_URL blank
npm install
npm run dev                # starts on http://localhost:3000
```

**4. Open the app**

Go to `http://localhost:3000`

- Click **Create one** → fill in signup form
- Log in → you'll see the dashboard
- Click **Add a pet** in the sidebar → fill in pet details
- Click **AI Symptom Check** → describe symptoms → click **Analyse Symptoms**
- View results with conditions, urgency, recommendations
- Click **Health History** to see all past checks

---

## Summary of Files Added / Changed

| File | What changed |
|---|---|
| `vite.config.js` | Added dev proxy `/api → localhost:8000` and port 3000 |
| `tailwind.config.js` | Fixed empty `content: []` → added `./src/**/*.{js,jsx}` |
| `.env.example` | New — documents `VITE_API_URL` |
| `src/services/api.js` | **New** — all backend API calls, token management, auto-refresh |
| `src/context/AuthContext.jsx` | **New** — auth state (user, login, logout, signup) |
| `src/context/PetContext.jsx` | **New** — pet list + CRUD, selected pet |
| `src/App.jsx` | Rewritten — auth gate, context providers, page router |
| `src/components/Header.jsx` | User info + logout button, language selector |
| `src/components/Sidebar.jsx` | Navigation with active state, pet switcher |
| `src/components/PetProfile.jsx` | Real pet data from PetContext |
| `src/components/SymptomInput.jsx` | Loading state, pet indicator, disabled when no pet |
| `src/components/ResultsPanel.jsx` | Rewritten — displays full backend response |
| `src/components/EmergencyAlert.jsx` | Driven by `record.is_emergency` (backend flag) |
| `src/components/LoadingSpinner.jsx` | **New** — reusable spinner |
| `src/components/FeedbackWidget.jsx` | **New** — thumbs up/down → POST /feedback |
| `src/pages/Login.jsx` | **New** — login form → `authApi.login()` |
| `src/pages/Signup.jsx` | **New** — signup form → `authApi.signup()` |
| `src/pages/Dashboard.jsx` | Real data from `healthApi.getSummary()` |
| `src/pages/Analyze.jsx` | Rewritten — `healthApi.analyse()` → real results |
| `src/pages/HealthHistory.jsx` | **New** — paginated records + expand + delete |
| `src/pages/AddPet.jsx` | **New** — pet creation form → `petsApi.create()` |
