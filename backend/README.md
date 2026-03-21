# AI Pet Health System — Backend

An intelligent pet health assistant API that analyses your pet's symptoms using AI, provides possible explanations, home-care tips, and tells you when to see a vet.

> **Disclaimer:** This system is not a medical diagnostic tool. It provides general health information only. Always consult a licensed veterinarian for your pet's health.

---

## Table of Contents

1. [What it does](#what-it-does)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Quick Start (Docker)](#quick-start-docker)
5. [Manual Setup (Local)](#manual-setup-local)
6. [Environment Variables](#environment-variables)
7. [First-Time Setup — Building the Knowledge Base](#first-time-setup--building-the-knowledge-base)
8. [API Overview](#api-overview)
9. [How the AI Works](#how-the-ai-works)
10. [Safety & Guardrails](#safety--guardrails)

---

## What it does

- **Symptom Analysis** — User describes their pet's symptoms in plain text. The AI analyses them and returns possible conditions, urgency level, and recommendations.
- **Emergency Detection** — Hard-coded rules catch life-threatening symptoms (seizures, poisoning, urinary blockage, etc.) before the AI even runs.
- **Pet Profiles** — Store profiles for multiple pets (species, breed, age, weight, known conditions).
- **Health History** — Every analysis is saved so you can track your pet's health over time.
- **Knowledge Base (RAG)** — The AI is grounded in a veterinary knowledge base (your own documents) using semantic search, reducing hallucinations.
- **Feedback Loop** — Users can rate each analysis to help improve future results.

---

## Tech Stack

| Layer | Technology |
|---|---|
| API Framework | FastAPI (Python) |
| Database | PostgreSQL + SQLAlchemy |
| AI / LLM | OpenAI GPT-4o (via LangChain) |
| Vector Search | FAISS + HuggingFace Embeddings |
| Authentication | JWT (access + refresh tokens) |
| Deployment | Docker + Docker Compose |

---

## Project Structure

```
backend/
│
├── main.py                      # App entry point — registers all routes & middleware
│
├── core/
│   ├── config.py                # App name, version, API prefix
│   ├── settings.py              # Reads all environment variables
│   └── database.py              # PostgreSQL connection & session
│
├── ai/
│   ├── llm.py                   # GPT-4o initialisation
│   ├── prompts.py               # System prompt & user message templates
│   ├── vet_rules.py             # Hard-coded emergency keyword rules
│   ├── embeddings.py            # FAISS vector store (load/save/search)
│   ├── symptom_analyzer.py      # Full AI analysis pipeline
│   └── ingest.py                # Builds the knowledge base from documents
│
├── api/routes/
│   ├── users.py                 # Signup, login, token refresh, profile
│   ├── pets.py                  # Create, list, update, delete pet profiles
│   ├── health_analysis.py       # Core symptom analysis + health records
│   └── admin.py                 # Trigger knowledge base ingestion
│
├── db_models/
│   ├── models.py                # SQLAlchemy table definitions
│   └── crud/
│       ├── users.py             # Database queries for users
│       ├── pets.py              # Database queries for pets
│       └── health_records.py    # Database queries for health records
│
├── schema_models/
│   ├── user_schemas.py          # Request/response shapes for user endpoints
│   ├── pet_schemas.py           # Request/response shapes for pet endpoints
│   └── health_schemas.py        # Request/response shapes for AI analysis
│
├── auth/
│   └── auth.py                  # JWT creation, validation, FastAPI dependencies
│
├── custom_errors/
│   └── exceptions.py            # Custom exception classes
│
├── knowledge_base/
│   ├── documents/               # Put your vet reference documents here (.txt, .pdf, .docx)
│   └── faiss_index/             # Auto-generated vector index (created after ingestion)
│
├── requirements.txt
├── .env.example
├── Dockerfile
└── docker-compose.yml
```

---

## Quick Start (Docker)

This is the easiest way to get running. You only need Docker installed.

**Step 1 — Clone and enter the backend folder**

```bash
cd backend
```

**Step 2 — Create your environment file**

```bash
cp .env.example .env
```

Then open `.env` and fill in your values (see [Environment Variables](#environment-variables) below).
At minimum you need:
- `OPENAI_API_KEY`
- `JWT_SECRET_KEY` (any long random string)

**Step 3 — Start the services**

```bash
docker-compose up --build
```

This starts:
- PostgreSQL database on port `5432`
- The API on port `8000`

**Step 4 — Check it's running**

Open your browser at: `http://localhost:8000`

You should see:
```json
{ "service": "AI Pet Health System", "version": "1.0.0", "status": "running" }
```

Interactive API docs are at: `http://localhost:8000/docs`

**Step 5 — Build the knowledge base (first time only)**

See [First-Time Setup — Building the Knowledge Base](#first-time-setup--building-the-knowledge-base) below.

---

## Manual Setup (Local)

Use this if you prefer not to use Docker.

**Requirements:** Python 3.11+, PostgreSQL running locally

**Step 1 — Create a virtual environment**

```bash
cd backend
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
```

**Step 2 — Install dependencies**

```bash
pip install -r requirements.txt
```

**Step 3 — Create your environment file**

```bash
cp .env.example .env
# Edit .env with your database credentials and API keys
```

**Step 4 — Create the database**

Make sure PostgreSQL is running, then create the database:

```bash
psql -U postgres -c "CREATE DATABASE pet_health_db;"
```

**Step 5 — Start the server**

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The `--reload` flag automatically restarts the server when you change code. Remove it in production.

**Step 6 — Build the knowledge base (first time only)**

See [First-Time Setup — Building the Knowledge Base](#first-time-setup--building-the-knowledge-base) below.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values below.

| Variable | Required | Default | Description |
|---|---|---|---|
| `POSTGRES_USER` | Yes | `postgres` | Database username |
| `POSTGRES_PASSWORD` | Yes | — | Database password |
| `POSTGRES_SERVER` | Yes | `localhost` | Database host |
| `POSTGRES_PORT` | No | `5432` | Database port |
| `POSTGRES_DB` | No | `pet_health_db` | Database name |
| `OPENAI_API_KEY` | Yes | — | Your OpenAI API key (`sk-...`) |
| `OPENAI_MODEL` | No | `gpt-4o` | GPT model to use for analysis |
| `JWT_SECRET_KEY` | Yes | — | Long random secret for signing tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `60` | How long access tokens last |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | How long refresh tokens last |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Allowed frontend origins (comma-separated) |
| `ADMIN_EMAILS` | No | — | Comma-separated admin emails for the `/admin` routes |
| `VECTOR_STORE_PATH` | No | `./knowledge_base/faiss_index` | Where the vector index is saved |
| `KNOWLEDGE_BASE_PATH` | No | `./knowledge_base/documents` | Where your vet documents live |

---

## First-Time Setup — Building the Knowledge Base

The AI uses a knowledge base of veterinary reference documents to give more accurate answers. A sample document is already included in `knowledge_base/documents/sample_vet_knowledge.txt`.

**To add your own documents:**

Drop `.txt`, `.pdf`, `.docx`, or `.md` files into `knowledge_base/documents/`. The more relevant vet content you add, the better the AI answers.

**To index the documents:**

You need to be logged in as an admin user (your email must be in `ADMIN_EMAILS` in `.env`).

1. Create an account via `POST /api/v1/users/signup`
2. Log in via `POST /api/v1/users/login` to get your token
3. Call the ingest endpoint:

```bash
curl -X POST http://localhost:8000/api/v1/admin/ingest \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:
```json
{ "status": "ok", "chunks_indexed": 47 }
```

This only needs to be done once, or whenever you add new documents.

> If no knowledge base exists yet, the AI will still work — it just won't have the extra vet context to draw from.

---

## API Overview

All endpoints are prefixed with `/api/v1`. Full interactive docs at `/docs`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users/signup` | Create a new account |
| POST | `/users/login` | Login and get tokens |
| POST | `/users/refresh` | Get new tokens using a refresh token |
| POST | `/users/logout` | Revoke a refresh token |
| GET | `/users/me` | Get your profile |
| PUT | `/users/me/password` | Change your password |
| DELETE | `/users/me` | Delete your account |

### Pet Profiles

| Method | Endpoint | Description |
|---|---|---|
| POST | `/pets/` | Add a new pet |
| GET | `/pets/` | List all your pets |
| GET | `/pets/{pet_id}` | Get one pet |
| PUT | `/pets/{pet_id}` | Update a pet |
| DELETE | `/pets/{pet_id}` | Delete a pet |

### Health Analysis

| Method | Endpoint | Description |
|---|---|---|
| POST | `/health/analyse` | **Submit symptoms for AI analysis** |
| GET | `/health/records/{pet_id}` | Get all health records for a pet |
| GET | `/health/records/{pet_id}/{record_id}` | Get a specific health record |
| POST | `/health/records/{pet_id}/{record_id}/feedback` | Rate whether analysis was helpful |
| GET | `/health/summary/{pet_id}` | Get health summary + common symptoms |
| DELETE | `/health/records/{pet_id}/{record_id}` | Delete a record |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/ingest` | Build/rebuild the knowledge base |
| GET | `/admin/vector-store/status` | Check knowledge base status |

---

## How the AI Works

When you submit symptoms, the following pipeline runs:

```
Your text input
      │
      ▼
1. Emergency Pre-Screen
   Hard-coded rules check for life-threatening keywords
   (seizures, poisoning, urinary blockage, etc.)
   If triggered → immediately flag as EMERGENCY, skip to step 5
      │
      ▼
2. Query Rewriting
   A fast LLM rewrites your symptom text into a clean
   veterinary search query for better knowledge retrieval
      │
      ▼
3. Knowledge Base Search
   The rewritten query is searched against your vet documents
   using FAISS semantic similarity → top 4 relevant chunks retrieved
      │
      ▼
4. GPT-4o Analysis
   The AI receives:
   - Your pet's profile (species, age, weight, known conditions)
   - Your symptom description
   - The retrieved vet knowledge
   It returns a structured JSON response
      │
      ▼
5. Response Assembly
   The JSON is validated and assembled into:
   - Possible conditions (name + description + likelihood)
   - Urgency level (low / moderate / high / emergency)
   - Recommendations
   - Home care tips
   - When to see a vet
   - Confidence score
   - Safety disclaimer
      │
      ▼
6. Saved to Database
   The full analysis is saved as a HealthRecord
   Symptoms are extracted and logged in the background
```

---

## Safety & Guardrails

Several layers protect against harmful or misleading responses:

1. **Hard-coded emergency rules** — Before the AI runs, a rule engine scans for keywords like `seizure`, `can't breathe`, `swallowed poison`, `straining to urinate`. If detected, the response is immediately flagged as an emergency and the user is directed to a vet. The AI cannot override this.

2. **Species-specific rules** — Additional checks for conditions that are particularly dangerous per species (e.g. urinary blockage in male cats, bloat in dogs).

3. **Mandatory disclaimer** — Every single response includes: *"This analysis is provided for informational purposes only and is NOT a veterinary diagnosis."*

4. **Structured output** — The AI is instructed to return only JSON. Responses are validated against a strict Pydantic schema before being returned to the user.

5. **Low temperature** — The LLM is configured at `temperature=0.3` to keep responses factual and consistent.

6. **No medication dosages** — The system prompt explicitly instructs the AI never to provide medication dosages and always refer to a vet for prescriptions.
