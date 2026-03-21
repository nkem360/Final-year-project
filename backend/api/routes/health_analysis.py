"""
Core AI health analysis endpoint.
POST /api/v1/health/analyse  →  runs full symptom analysis pipeline
"""

import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from core.database import get_db
from auth.auth import get_current_user
from db_models.models import User
from db_models.crud.pets import PetCRUD
from db_models.crud.health_records import HealthRecordCRUD, SymptomLogCRUD
from schema_models.health_schemas import (
    SymptomAnalysisRequest,
    HealthRecordResponse,
    FeedbackRequest,
    HealthSummaryResponse,
)
from ai.symptom_analyzer import analyse_symptoms, extract_symptoms
from custom_errors.exceptions import PetNotFound, AIAnalysisError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["Health Analysis"])


# ─── Helper ──────────────────────────────────────────────────────────────────


def _ensure_pet_ownership(db: Session, pet_id: int, owner_id: int):
    """Raise 404 if pet doesn't exist or doesn't belong to owner."""
    try:
        return PetCRUD.get_by_id_and_owner(db, pet_id=pet_id, owner_id=owner_id)
    except PetNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")


# ─── Main Analysis Endpoint ───────────────────────────────────────────────────


@router.post("/analyse", response_model=HealthRecordResponse, status_code=status.HTTP_201_CREATED)
async def analyse_pet_symptoms(
    payload: SymptomAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit pet symptoms for AI analysis.

    - Runs emergency keyword pre-screening
    - Retrieves relevant vet knowledge from the knowledge base
    - Calls GPT-4o to generate possible conditions and recommendations
    - Persists the health record and symptom log
    - Returns structured analysis including urgency level and disclaimer

    **NOT a medical diagnosis — always consult a licensed veterinarian.**
    """
    pet = _ensure_pet_ownership(db, payload.pet_id, current_user.id)

    try:
        analysis = await analyse_symptoms(
            pet=pet,
            symptoms_text=payload.symptoms_text,
            image_url=payload.image_url,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        logger.error(f"AI analysis failed for pet {payload.pet_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI analysis service is temporarily unavailable. Please try again.",
        )

    # Persist health record
    record = HealthRecordCRUD.create(
        db,
        pet_id=pet.id,
        symptoms_text=payload.symptoms_text,
        analysis=analysis,
        image_url=payload.image_url,
    )

    # Log symptoms in background (non-blocking)
    async def _log_symptoms():
        try:
            normalized = await extract_symptoms(payload.symptoms_text)
            SymptomLogCRUD.create(
                db,
                pet_id=pet.id,
                symptom_text=payload.symptoms_text,
                normalized_symptoms=normalized,
                health_record_id=record.id,
            )
        except Exception as ex:
            logger.warning(f"Background symptom extraction failed: {ex}")

    background_tasks.add_task(_log_symptoms)

    return record


# ─── Health Record Retrieval ──────────────────────────────────────────────────


@router.get("/records/{pet_id}", response_model=List[HealthRecordResponse])
def get_health_records(
    pet_id: int,
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all health analysis records for a specific pet (most recent first)."""
    _ensure_pet_ownership(db, pet_id, current_user.id)
    return HealthRecordCRUD.get_by_pet(db, pet_id=pet_id, limit=limit, offset=offset)


@router.get("/records/{pet_id}/{record_id}", response_model=HealthRecordResponse)
def get_health_record(
    pet_id: int,
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific health record."""
    _ensure_pet_ownership(db, pet_id, current_user.id)
    record = HealthRecordCRUD.get_by_id(db, record_id)
    if not record or record.pet_id != pet_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record


# ─── Feedback ────────────────────────────────────────────────────────────────


@router.post("/records/{pet_id}/{record_id}/feedback", response_model=HealthRecordResponse)
def submit_feedback(
    pet_id: int,
    record_id: int,
    payload: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit feedback on whether the AI analysis was helpful.
    Used to improve future prompt quality.
    """
    _ensure_pet_ownership(db, pet_id, current_user.id)
    try:
        return HealthRecordCRUD.update_feedback(
            db,
            record_id=record_id,
            pet_id=pet_id,
            was_helpful=payload.was_helpful,
            user_feedback=payload.user_feedback,
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")


# ─── Summary ─────────────────────────────────────────────────────────────────


@router.get("/summary/{pet_id}", response_model=HealthSummaryResponse)
def get_health_summary(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a health summary for a pet, including total records and common symptoms."""
    pet = _ensure_pet_ownership(db, pet_id, current_user.id)
    total = HealthRecordCRUD.count_by_pet(db, pet_id)
    recent = HealthRecordCRUD.get_by_pet(db, pet_id, limit=5)
    common_symptoms = SymptomLogCRUD.get_common_symptoms(db, pet_id)

    return HealthSummaryResponse(
        pet_id=pet_id,
        pet_name=pet.name,
        total_records=total,
        recent_records=recent,
        most_common_symptoms=common_symptoms,
    )


# ─── Delete ──────────────────────────────────────────────────────────────────


@router.delete("/records/{pet_id}/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_health_record(
    pet_id: int,
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific health record."""
    _ensure_pet_ownership(db, pet_id, current_user.id)
    try:
        HealthRecordCRUD.delete(db, record_id=record_id, pet_id=pet_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
