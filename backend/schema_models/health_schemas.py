from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from db_models.models import UrgencyLevel


# ─── Request Models ─────────────────────────────────────────────────────────


class SymptomAnalysisRequest(BaseModel):
    pet_id: int
    symptoms_text: str
    image_url: Optional[str] = None  # Pre-uploaded S3 URL

    class Config:
        json_schema_extra = {
            "example": {
                "pet_id": 1,
                "symptoms_text": "My dog is limping and not eating for the past two days.",
                "image_url": None,
            }
        }


class FeedbackRequest(BaseModel):
    was_helpful: bool
    user_feedback: Optional[str] = None


# ─── AI Output Sub-models ────────────────────────────────────────────────────


class PossibleCondition(BaseModel):
    name: str
    description: str
    likelihood: str  # "low" | "moderate" | "high"


class AnalysisResult(BaseModel):
    possible_conditions: List[PossibleCondition]
    urgency_level: UrgencyLevel
    recommendations: List[str]
    home_care_tips: List[str]
    when_to_see_vet: str
    ai_summary: str
    confidence_score: float
    disclaimer: str
    is_emergency: bool
    emergency_message: Optional[str] = None


# ─── Response Models ─────────────────────────────────────────────────────────


class HealthRecordResponse(BaseModel):
    id: int
    pet_id: int
    symptoms_text: str
    image_url: Optional[str]
    possible_conditions: Optional[List[dict]]
    urgency_level: Optional[UrgencyLevel]
    recommendations: Optional[List[str]]
    home_care_tips: Optional[List[str]]
    when_to_see_vet: Optional[str]
    ai_summary: Optional[str]
    confidence_score: Optional[float]
    disclaimer: Optional[str]
    is_emergency: bool
    emergency_message: Optional[str]
    was_helpful: Optional[bool]
    user_feedback: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SymptomLogResponse(BaseModel):
    id: int
    pet_id: int
    health_record_id: Optional[int]
    symptom_text: str
    normalized_symptoms: Optional[List[str]]
    logged_at: datetime

    class Config:
        from_attributes = True


class HealthSummaryResponse(BaseModel):
    pet_id: int
    pet_name: str
    total_records: int
    recent_records: List[HealthRecordResponse]
    most_common_symptoms: List[str]
