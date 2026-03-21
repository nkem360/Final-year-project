"""
Vector store management for the pet health knowledge base.
Uses FAISS + HuggingFace embeddings (offline-capable) or OpenAI embeddings.
Falls back gracefully if the vector store has not been built yet.
"""

import os
import logging
from typing import Optional, List
from pathlib import Path

from langchain_community.vectorstores import FAISS
from langchain.schema import Document
from core.settings import VECTOR_STORE_PATH, KNOWLEDGE_BASE_PATH, EMBEDDING_MODEL

logger = logging.getLogger(__name__)

_embeddings_instance = None
_vector_store_instance: Optional[FAISS] = None


def get_embeddings():
    """Return a singleton embeddings model. Prefers HuggingFace (no API cost)."""
    global _embeddings_instance
    if _embeddings_instance is None:
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            _embeddings_instance = HuggingFaceEmbeddings(
                model_name=EMBEDDING_MODEL,
                model_kwargs={"device": "cpu", "trust_remote_code": True},
                encode_kwargs={"normalize_embeddings": True},
            )
            logger.info(f"Loaded HuggingFace embeddings: {EMBEDDING_MODEL}")
        except Exception as e:
            logger.warning(f"HuggingFace embeddings failed ({e}), falling back to OpenAI embeddings")
            from langchain_openai import OpenAIEmbeddings
            from core.settings import get_openai_credentials
            creds = get_openai_credentials()
            _embeddings_instance = OpenAIEmbeddings(
                api_key=creds["OPENAI_API_KEY"],
                model=creds["OPENAI_EMBEDDING_MODEL"],
            )
    return _embeddings_instance


async def load_vector_store() -> Optional[FAISS]:
    """Load the FAISS vector store from disk. Returns None if not built yet."""
    global _vector_store_instance
    if _vector_store_instance is not None:
        return _vector_store_instance

    store_path = Path(VECTOR_STORE_PATH)
    if not store_path.exists():
        logger.warning(
            f"Vector store not found at {VECTOR_STORE_PATH}. "
            "RAG context will be unavailable until the knowledge base is ingested."
        )
        return None

    try:
        embeddings = get_embeddings()
        _vector_store_instance = FAISS.load_local(
            str(store_path),
            embeddings,
            allow_dangerous_deserialization=True,
        )
        logger.info(f"Loaded FAISS vector store from {VECTOR_STORE_PATH}")
        return _vector_store_instance
    except Exception as e:
        logger.error(f"Failed to load vector store: {e}")
        return None


async def save_vector_store(vector_store: FAISS) -> None:
    """Persist a FAISS vector store to disk."""
    store_path = Path(VECTOR_STORE_PATH)
    store_path.mkdir(parents=True, exist_ok=True)
    vector_store.save_local(str(store_path))
    logger.info(f"Saved FAISS vector store to {VECTOR_STORE_PATH}")


async def create_vector_store(documents: List[Document]) -> FAISS:
    """Create a new FAISS vector store from a list of LangChain Documents."""
    embeddings = get_embeddings()
    store = FAISS.from_documents(documents, embeddings)
    await save_vector_store(store)
    global _vector_store_instance
    _vector_store_instance = store
    return store


async def retrieve_relevant_context(query: str, k: int = 4) -> str:
    """
    Retrieve top-k relevant document chunks from the knowledge base.
    Returns formatted context string, or empty string if store unavailable.
    """
    store = await load_vector_store()
    if store is None:
        return ""

    try:
        docs = store.similarity_search(query, k=k)
        if not docs:
            return ""

        parts = []
        for i, doc in enumerate(docs, 1):
            source = doc.metadata.get("source", "veterinary knowledge base")
            parts.append(f"[Source {i}: {source}]\n{doc.page_content}")

        return "\n\n".join(parts)
    except Exception as e:
        logger.error(f"Vector store retrieval error: {e}")
        return ""
