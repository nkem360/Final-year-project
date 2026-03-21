import os
from dotenv import load_dotenv

load_dotenv()


def get_db_credentials() -> dict:
    return {
        "POSTGRES_USER": os.getenv("POSTGRES_USER", "postgres"),
        "POSTGRES_PASSWORD": os.getenv("POSTGRES_PASSWORD", "password"),
        "POSTGRES_SERVER": os.getenv("POSTGRES_SERVER", "localhost"),
        "POSTGRES_PORT": os.getenv("POSTGRES_PORT", "5432"),
        "POSTGRES_DB": os.getenv("POSTGRES_DB", "pet_health_db"),
    }


def get_database_url() -> str:
    creds = get_db_credentials()
    return (
        f"postgresql://{creds['POSTGRES_USER']}:{creds['POSTGRES_PASSWORD']}"
        f"@{creds['POSTGRES_SERVER']}:{creds['POSTGRES_PORT']}/{creds['POSTGRES_DB']}"
    )


def get_openai_credentials() -> dict:
    return {
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
        "OPENAI_MODEL": os.getenv("OPENAI_MODEL", "gpt-4o"),
        "OPENAI_EMBEDDING_MODEL": os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
    }


def get_jwt_settings() -> dict:
    return {
        "SECRET_KEY": os.getenv("JWT_SECRET_KEY", "change-this-secret-key-in-production"),
        "ALGORITHM": os.getenv("JWT_ALGORITHM", "HS256"),
        "ACCESS_TOKEN_EXPIRE_MINUTES": int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")),
        "REFRESH_TOKEN_EXPIRE_DAYS": int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")),
    }


def get_storage_settings() -> dict:
    return {
        "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID"),
        "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY"),
        "AWS_BUCKET_NAME": os.getenv("AWS_BUCKET_NAME", "pet-health-images"),
        "AWS_REGION": os.getenv("AWS_REGION", "us-east-1"),
    }


def get_cors_origins() -> list[str]:
    origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
    return [o.strip() for o in origins.split(",")]


# RAG/AI config
VECTOR_STORE_PATH = os.getenv("VECTOR_STORE_PATH", "./knowledge_base/faiss_index")
KNOWLEDGE_BASE_PATH = os.getenv("KNOWLEDGE_BASE_PATH", "./knowledge_base/documents")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-large-en-v1.5")
RERANK_MODEL = os.getenv("RERANK_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
