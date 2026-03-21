# API Documentation — AI Pet Health System

> Base URL: `http://localhost:8000/api/v1`
> Interactive docs (Swagger UI): `http://localhost:8000/docs`

All protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <your_access_token>
```

---

## Contents

- [Authentication](#authentication)
- [Pet Profiles](#pet-profiles)
- [Health Analysis](#health-analysis)
- [Admin](#admin)
- [Response Formats](#response-formats)
- [Error Codes](#error-codes)

---

## Authentication

### POST `/users/signup`

Create a new user account.

**Request body**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Rules**
- `username`: minimum 3 characters
- `password`: minimum 8 characters

**Response `201`**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "is_active": true,
  "is_verified": false,
  "created_at": "2026-03-21T10:00:00"
}
```

**Errors**
- `409` — Email already registered

---

### POST `/users/login`

Login with email and password. Returns tokens.

**Request body**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response `200`**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "bearer"
}
```

- **Access token** — short-lived (default 60 min). Use this in `Authorization` headers.
- **Refresh token** — long-lived (default 7 days). Use this to get a new access token.

**Errors**
- `401` — Wrong email or password
- `403` — Account inactive

---

### POST `/users/refresh`

Exchange a refresh token for a new pair of tokens (old refresh token is revoked).

**Request body**
```json
{
  "refresh_token": "eyJhbGci..."
}
```

**Response `200`** — Same structure as login response.

**Errors**
- `401` — Token expired or invalid

---

### POST `/users/logout`

Revoke a refresh token to end the session.

**Request body**
```json
{
  "refresh_token": "eyJhbGci..."
}
```

**Response `204`** — No content.

---

### GET `/users/me` 🔒

Get the currently authenticated user's profile.

**Response `200`** — Same as signup response.

---

### PUT `/users/me/password` 🔒

Change your password.

**Request body**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

**Response `204`** — No content.

**Errors**
- `400` — Current password is wrong

---

### DELETE `/users/me` 🔒

Permanently delete your account and all pets + health records.

**Response `204`** — No content.

---

## Pet Profiles

### POST `/pets/` 🔒

Add a new pet.

**Request body**
```json
{
  "name": "Buddy",
  "species": "dog",
  "breed": "Labrador Retriever",
  "age_years": 3.5,
  "weight_kg": 28.0,
  "gender": "male",
  "is_neutered": true,
  "color": "golden",
  "medical_notes": "Allergic to chicken. Previously diagnosed with mild hip dysplasia."
}
```

**Species options:** `dog`, `cat`, `bird`, `rabbit`, `hamster`, `fish`, `reptile`, `other`

All fields except `name` and `species` are optional.

**Response `201`**
```json
{
  "id": 1,
  "owner_id": 1,
  "name": "Buddy",
  "species": "dog",
  "breed": "Labrador Retriever",
  "age_years": 3.5,
  "weight_kg": 28.0,
  "gender": "male",
  "is_neutered": true,
  "color": "golden",
  "medical_notes": "Allergic to chicken...",
  "profile_image_url": null,
  "created_at": "2026-03-21T10:00:00",
  "updated_at": "2026-03-21T10:00:00"
}
```

---

### GET `/pets/` 🔒

List all your pets.

**Response `200`** — Array of pet objects (same structure as above).

---

### GET `/pets/{pet_id}` 🔒

Get a single pet by ID.

**Response `200`** — Single pet object.

**Errors**
- `404` — Pet not found or doesn't belong to you

---

### PUT `/pets/{pet_id}` 🔒

Update a pet's profile. Send only the fields you want to change.

**Request body** (all fields optional)
```json
{
  "weight_kg": 29.5,
  "medical_notes": "Allergic to chicken. Hip dysplasia confirmed by vet."
}
```

**Response `200`** — Updated pet object.

---

### DELETE `/pets/{pet_id}` 🔒

Delete a pet and all its health records and symptom logs.

**Response `204`** — No content.

---

## Health Analysis

### POST `/health/analyse` 🔒

Submit your pet's symptoms for AI analysis. This is the core endpoint.

**Request body**
```json
{
  "pet_id": 1,
  "symptoms_text": "My dog has been limping on his front left leg for two days and seems reluctant to eat. He's also been whining when I touch his shoulder.",
  "image_url": null
}
```

- `pet_id` — must belong to you
- `symptoms_text` — describe what you're seeing in plain language
- `image_url` — optional, URL of a pre-uploaded image (S3 or similar)

**Response `201`**
```json
{
  "id": 12,
  "pet_id": 1,
  "symptoms_text": "My dog has been limping...",
  "image_url": null,
  "possible_conditions": [
    {
      "name": "Soft tissue injury / muscle strain",
      "description": "A sprain or strain of the shoulder or leg muscles, often from over-exertion or a misstep.",
      "likelihood": "high"
    },
    {
      "name": "Joint pain / early arthritis",
      "description": "Inflammation of the shoulder joint causing pain and reluctance to bear weight.",
      "likelihood": "moderate"
    },
    {
      "name": "Bone fracture",
      "description": "A partial or complete break of a bone, typically from trauma.",
      "likelihood": "low"
    }
  ],
  "urgency_level": "moderate",
  "recommendations": [
    "Restrict your dog's activity — no running, jumping, or stairs for 48 hours.",
    "Visit a vet for a physical examination and possible X-ray.",
    "Do not give human pain medication (ibuprofen, paracetamol) — these are toxic to dogs."
  ],
  "home_care_tips": [
    "Apply an ice pack wrapped in a towel to the area for 10 minutes, 2–3 times a day.",
    "Keep your dog calm and resting in a comfortable spot.",
    "Monitor for worsening symptoms: swelling, complete refusal to walk, fever."
  ],
  "when_to_see_vet": "See a vet within 24–48 hours if limping persists or worsens, the joint appears swollen or deformed, your dog develops a fever, or stops eating entirely.",
  "ai_summary": "Buddy's limping and shoulder pain are most consistent with a soft tissue injury or joint inflammation. These are common in active dogs and often improve with rest, but veterinary assessment is recommended to rule out fracture or joint disease.",
  "confidence_score": 0.72,
  "disclaimer": "⚠️ IMPORTANT: This analysis is provided for informational purposes only and is NOT a veterinary diagnosis. Always consult a licensed veterinarian for your pet's health concerns.",
  "is_emergency": false,
  "emergency_message": null,
  "was_helpful": null,
  "user_feedback": null,
  "created_at": "2026-03-21T10:15:00"
}
```

**Emergency response example** (when life-threatening keywords are detected)
```json
{
  "urgency_level": "emergency",
  "is_emergency": true,
  "emergency_message": "⚠️ EMERGENCY DETECTED: Your pet may be experiencing a life-threatening situation. Please contact your nearest emergency veterinary clinic IMMEDIATELY. Detected concern(s): seizure.",
  ...
}
```

**Urgency levels explained**

| Level | Meaning |
|---|---|
| `low` | Monitor at home; unlikely to be serious |
| `moderate` | See a vet within 24–48 hours |
| `high` | See a vet today |
| `emergency` | Go to an emergency vet NOW |

**Errors**
- `404` — Pet not found
- `422` — AI returned an unstructured response (retry)
- `503` — AI service temporarily unavailable

---

### GET `/health/records/{pet_id}` 🔒

Get all past health analysis records for a pet (newest first).

**Query parameters**

| Param | Default | Description |
|---|---|---|
| `limit` | `20` | Max records to return |
| `offset` | `0` | Number of records to skip (for pagination) |

**Example**
```
GET /health/records/1?limit=10&offset=0
```

**Response `200`** — Array of health record objects.

---

### GET `/health/records/{pet_id}/{record_id}` 🔒

Get a single health record.

**Response `200`** — Single health record object.

**Errors**
- `404` — Record not found

---

### POST `/health/records/{pet_id}/{record_id}/feedback` 🔒

Rate whether the AI analysis was helpful. This data can be used to improve the system.

**Request body**
```json
{
  "was_helpful": true,
  "user_feedback": "The suggestions were accurate — vet confirmed a soft tissue injury."
}
```

- `was_helpful` — required, boolean
- `user_feedback` — optional, text

**Response `200`** — Updated health record with feedback included.

---

### GET `/health/summary/{pet_id}` 🔒

Get a health overview for a pet.

**Response `200`**
```json
{
  "pet_id": 1,
  "pet_name": "Buddy",
  "total_records": 8,
  "recent_records": [ ...last 5 records... ],
  "most_common_symptoms": ["limping", "loss of appetite", "lethargy", "vomiting"]
}
```

---

### DELETE `/health/records/{pet_id}/{record_id}` 🔒

Delete a specific health record.

**Response `204`** — No content.

---

## Admin

These endpoints require your email to be listed in the `ADMIN_EMAILS` environment variable.

### POST `/admin/ingest` 🔒 (admin only)

Scan the `knowledge_base/documents/` folder, process all documents, and build the FAISS vector search index. Run this once after adding new vet documents.

**Response `200`**
```json
{
  "status": "ok",
  "chunks_indexed": 47
}
```

**Errors**
- `403` — Not an admin
- `500` — Ingestion failed (check server logs)

---

### GET `/admin/vector-store/status` 🔒 (admin only)

Check whether the knowledge base vector index has been built.

**Response `200`**
```json
{
  "vector_store_exists": true,
  "vector_store_path": "./knowledge_base/faiss_index",
  "knowledge_base_path": "./knowledge_base/documents",
  "knowledge_base_documents": 3
}
```

---

## Response Formats

### Standard success

All successful responses return the resource directly (no wrapper).

### Standard error

```json
{
  "detail": "Human-readable error message here"
}
```

### Validation error (422)

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

---

## Error Codes

| Code | Meaning |
|---|---|
| `400` | Bad request — invalid input |
| `401` | Unauthorised — missing or invalid token |
| `403` | Forbidden — not allowed to access this resource |
| `404` | Not found |
| `409` | Conflict — e.g. email already in use |
| `422` | Unprocessable entity — validation failed |
| `429` | Too many requests |
| `500` | Internal server error |
| `503` | AI service unavailable (OpenAI API issue) |

---

## Data Models Reference

### Pet Species

`dog` | `cat` | `bird` | `rabbit` | `hamster` | `fish` | `reptile` | `other`

### Urgency Levels

`low` | `moderate` | `high` | `emergency`

### Condition Likelihood

`low` | `moderate` | `high`
