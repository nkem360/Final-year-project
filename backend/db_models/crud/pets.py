from sqlalchemy.orm import Session
from typing import List, Optional
from db_models.models import Pet
from schema_models.pet_schemas import PetCreate, PetUpdate
from custom_errors.exceptions import PetNotFound, Forbidden


class PetCRUD:

    @staticmethod
    def get_by_id(db: Session, pet_id: int) -> Optional[Pet]:
        return db.query(Pet).filter(Pet.id == pet_id).first()

    @staticmethod
    def get_by_owner(db: Session, owner_id: int) -> List[Pet]:
        return db.query(Pet).filter(Pet.owner_id == owner_id).all()

    @staticmethod
    def get_by_id_and_owner(db: Session, pet_id: int, owner_id: int) -> Pet:
        pet = db.query(Pet).filter(Pet.id == pet_id, Pet.owner_id == owner_id).first()
        if not pet:
            raise PetNotFound(f"Pet {pet_id} not found")
        return pet

    @staticmethod
    def create(db: Session, owner_id: int, data: PetCreate) -> Pet:
        pet = Pet(owner_id=owner_id, **data.model_dump())
        db.add(pet)
        db.commit()
        db.refresh(pet)
        return pet

    @staticmethod
    def update(db: Session, pet_id: int, owner_id: int, data: PetUpdate) -> Pet:
        pet = PetCRUD.get_by_id_and_owner(db, pet_id, owner_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(pet, key, value)
        db.commit()
        db.refresh(pet)
        return pet

    @staticmethod
    def delete(db: Session, pet_id: int, owner_id: int) -> bool:
        pet = PetCRUD.get_by_id_and_owner(db, pet_id, owner_id)
        db.delete(pet)
        db.commit()
        return True
