from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
from db_models.models import User
from custom_errors.exceptions import UserAlreadyExists, UserNotFound


class UserCRUD:

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.lower()).first()

    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def create(db: Session, username: str, email: str, hashed_password: str) -> User:
        user = User(
            username=username,
            email=email.lower(),
            hashed_password=hashed_password,
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
            return user
        except IntegrityError:
            db.rollback()
            raise UserAlreadyExists(f"User with email '{email}' already exists")

    @staticmethod
    def update_active(db: Session, user_id: int, is_active: bool) -> User:
        user = UserCRUD.get_by_id(db, user_id)
        if not user:
            raise UserNotFound(f"User {user_id} not found")
        user.is_active = is_active
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update_password(db: Session, user_id: int, hashed_password: str) -> User:
        user = UserCRUD.get_by_id(db, user_id)
        if not user:
            raise UserNotFound(f"User {user_id} not found")
        user.hashed_password = hashed_password
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete(db: Session, user_id: int) -> bool:
        user = UserCRUD.get_by_id(db, user_id)
        if not user:
            raise UserNotFound(f"User {user_id} not found")
        db.delete(user)
        db.commit()
        return True
