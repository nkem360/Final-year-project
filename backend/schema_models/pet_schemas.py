from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from db_models.models import PetSpecies


class PetCreate(BaseModel):
    name: str
    species: PetSpecies
    breed: Optional[str] = None
    age_years: Optional[float] = None
    weight_kg: Optional[float] = None
    gender: Optional[str] = None
    is_neutered: Optional[bool] = None
    color: Optional[str] = None
    medical_notes: Optional[str] = None


class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[PetSpecies] = None
    breed: Optional[str] = None
    age_years: Optional[float] = None
    weight_kg: Optional[float] = None
    gender: Optional[str] = None
    is_neutered: Optional[bool] = None
    color: Optional[str] = None
    medical_notes: Optional[str] = None
    profile_image_url: Optional[str] = None


class PetResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    species: PetSpecies
    breed: Optional[str]
    age_years: Optional[float]
    weight_kg: Optional[float]
    gender: Optional[str]
    is_neutered: Optional[bool]
    color: Optional[str]
    medical_notes: Optional[str]
    profile_image_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
