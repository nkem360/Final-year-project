"""
Admin-only endpoints:
- Trigger knowledge base ingestion
- Vector store status
"""

import logging
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status

from auth.auth import get_current_user
from db_models.models import User
from core.settings import VECTOR_STORE_PATH, KNOWLEDGE_BASE_PATH
from ai.ingest import ingest_knowledge_base

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_EMAILS = set(
    e.strip()
    for e in os.getenv("ADMIN_EMAILS", "").split(",")
    if e.strip()
)


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


@router.post("/ingest", status_code=status.HTTP_200_OK)
async def trigger_ingestion(admin: User = Depends(require_admin)):
    """
    Trigger a full knowledge base ingestion.
    Reads documents from KNOWLEDGE_BASE_PATH, builds FAISS vector store.
    """
    try:
        count = await ingest_knowledge_base()
        return {"status": "ok", "chunks_indexed": count}
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {str(e)}",
        )


@router.get("/vector-store/status")
def vector_store_status(admin: User = Depends(require_admin)):
    """Check whether the FAISS vector store exists on disk."""
    store_path = Path(VECTOR_STORE_PATH)
    kb_path = Path(KNOWLEDGE_BASE_PATH)
    doc_count = len(list(kb_path.rglob("*"))) if kb_path.exists() else 0

    return {
        "vector_store_exists": store_path.exists(),
        "vector_store_path": str(store_path),
        "knowledge_base_path": str(kb_path),
        "knowledge_base_documents": doc_count,
    }
