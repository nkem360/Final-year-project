import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from auth.auth import get_current_user
from db_models.models import User
from db_models.crud.pets import PetCRUD
from schema_models.pet_schemas import PetCreate, PetUpdate, PetResponse
from custom_errors.exceptions import PetNotFound

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pets", tags=["Pets"])


@router.post("/", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
def create_pet(
    payload: PetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new pet profile for the authenticated user."""
    return PetCRUD.create(db, owner_id=current_user.id, data=payload)


@router.get("/", response_model=List[PetResponse])
def list_pets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all pets belonging to the authenticated user."""
    return PetCRUD.get_by_owner(db, owner_id=current_user.id)


@router.get("/{pet_id}", response_model=PetResponse)
def get_pet(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific pet profile."""
    try:
        return PetCRUD.get_by_id_and_owner(db, pet_id=pet_id, owner_id=current_user.id)
    except PetNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")


@router.put("/{pet_id}", response_model=PetResponse)
def update_pet(
    pet_id: int,
    payload: PetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a pet profile."""
    try:
        return PetCRUD.update(db, pet_id=pet_id, owner_id=current_user.id, data=payload)
    except PetNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")


@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pet(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a pet and all its associated health records."""
    try:
        PetCRUD.delete(db, pet_id=pet_id, owner_id=current_user.id)
    except PetNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
