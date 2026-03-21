from sqlalchemy.orm import Session
from typing import List, Optional
from db_models.models import HealthRecord, SymptomLog, UrgencyLevel
from schema_models.health_schemas import AnalysisResult
from custom_errors.exceptions import RecordNotFound


class HealthRecordCRUD:

    @staticmethod
    def create(
        db: Session,
        pet_id: int,
        symptoms_text: str,
        analysis: AnalysisResult,
        image_url: Optional[str] = None,
    ) -> HealthRecord:
        record = HealthRecord(
            pet_id=pet_id,
            symptoms_text=symptoms_text,
            image_url=image_url,
            possible_conditions=[c.model_dump() for c in analysis.possible_conditions],
            urgency_level=analysis.urgency_level,
            recommendations=analysis.recommendations,
            home_care_tips=analysis.home_care_tips,
            when_to_see_vet=analysis.when_to_see_vet,
            ai_summary=analysis.ai_summary,
            confidence_score=analysis.confidence_score,
            disclaimer=analysis.disclaimer,
            is_emergency=analysis.is_emergency,
            emergency_message=analysis.emergency_message,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def get_by_id(db: Session, record_id: int) -> Optional[HealthRecord]:
        return db.query(HealthRecord).filter(HealthRecord.id == record_id).first()

    @staticmethod
    def get_by_pet(
        db: Session,
        pet_id: int,
        limit: int = 20,
        offset: int = 0,
    ) -> List[HealthRecord]:
        return (
            db.query(HealthRecord)
            .filter(HealthRecord.pet_id == pet_id)
            .order_by(HealthRecord.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    @staticmethod
    def update_feedback(
        db: Session,
        record_id: int,
        pet_id: int,
        was_helpful: bool,
        user_feedback: Optional[str] = None,
    ) -> HealthRecord:
        record = (
            db.query(HealthRecord)
            .filter(HealthRecord.id == record_id, HealthRecord.pet_id == pet_id)
            .first()
        )
        if not record:
            raise RecordNotFound(f"Health record {record_id} not found")
        record.was_helpful = was_helpful
        record.user_feedback = user_feedback
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def delete(db: Session, record_id: int, pet_id: int) -> bool:
        record = (
            db.query(HealthRecord)
            .filter(HealthRecord.id == record_id, HealthRecord.pet_id == pet_id)
            .first()
        )
        if not record:
            raise RecordNotFound(f"Health record {record_id} not found")
        db.delete(record)
        db.commit()
        return True

    @staticmethod
    def count_by_pet(db: Session, pet_id: int) -> int:
        return db.query(HealthRecord).filter(HealthRecord.pet_id == pet_id).count()


class SymptomLogCRUD:

    @staticmethod
    def create(
        db: Session,
        pet_id: int,
        symptom_text: str,
        normalized_symptoms: Optional[List[str]] = None,
        health_record_id: Optional[int] = None,
    ) -> SymptomLog:
        log = SymptomLog(
            pet_id=pet_id,
            symptom_text=symptom_text,
            normalized_symptoms=normalized_symptoms,
            health_record_id=health_record_id,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def get_by_pet(db: Session, pet_id: int, limit: int = 50) -> List[SymptomLog]:
        return (
            db.query(SymptomLog)
            .filter(SymptomLog.pet_id == pet_id)
            .order_by(SymptomLog.logged_at.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_common_symptoms(db: Session, pet_id: int) -> List[str]:
        """Return the most commonly reported symptom tags for a pet."""
        logs = SymptomLogCRUD.get_by_pet(db, pet_id, limit=100)
        freq: dict[str, int] = {}
        for log in logs:
            for sym in (log.normalized_symptoms or []):
                freq[sym] = freq.get(sym, 0) + 1
        return sorted(freq, key=lambda k: freq[k], reverse=True)[:10]
