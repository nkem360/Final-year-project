from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime,
    ForeignKey, Text, Enum, JSON
)
from sqlalchemy.orm import relationship
from core.database import Base
import enum


class PetSpecies(str, enum.Enum):
    dog = "dog"
    cat = "cat"
    bird = "bird"
    rabbit = "rabbit"
    hamster = "hamster"
    fish = "fish"
    reptile = "reptile"
    other = "other"


class UrgencyLevel(str, enum.Enum):
    low = "low"
    moderate = "moderate"
    high = "high"
    emergency = "emergency"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    pets = relationship("Pet", back_populates="owner", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User id={self.id} email={self.email}>"


class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    species = Column(Enum(PetSpecies), nullable=False)
    breed = Column(String(100), nullable=True)
    age_years = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    gender = Column(String(10), nullable=True)  # male, female, unknown
    is_neutered = Column(Boolean, nullable=True)
    color = Column(String(100), nullable=True)
    medical_notes = Column(Text, nullable=True)  # known allergies, chronic conditions
    profile_image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="pets")
    health_records = relationship("HealthRecord", back_populates="pet", cascade="all, delete-orphan")
    symptom_logs = relationship("SymptomLog", back_populates="pet", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Pet id={self.id} name={self.name} species={self.species}>"


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False, index=True)
    # Input
    symptoms_text = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)

    # AI output
    possible_conditions = Column(JSON, nullable=True)   # List of {name, description, likelihood}
    urgency_level = Column(Enum(UrgencyLevel), nullable=True)
    recommendations = Column(JSON, nullable=True)        # List of recommendation strings
    home_care_tips = Column(JSON, nullable=True)         # List of home care tip strings
    when_to_see_vet = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)     # 0.0–1.0

    # Safety
    disclaimer = Column(Text, nullable=True)
    is_emergency = Column(Boolean, default=False)
    emergency_message = Column(Text, nullable=True)

    # Feedback
    was_helpful = Column(Boolean, nullable=True)
    user_feedback = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    pet = relationship("Pet", back_populates="health_records")

    def __repr__(self):
        return f"<HealthRecord id={self.id} pet_id={self.pet_id} urgency={self.urgency_level}>"


class SymptomLog(Base):
    __tablename__ = "symptom_logs"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False, index=True)
    health_record_id = Column(Integer, ForeignKey("health_records.id"), nullable=True)
    symptom_text = Column(Text, nullable=False)
    normalized_symptoms = Column(JSON, nullable=True)  # Extracted/normalised symptom tags
    logged_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    pet = relationship("Pet", back_populates="symptom_logs")

    def __repr__(self):
        return f"<SymptomLog id={self.id} pet_id={self.pet_id}>"


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String(500), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")

    def __repr__(self):
        return f"<RefreshToken id={self.id} user_id={self.user_id}>"
