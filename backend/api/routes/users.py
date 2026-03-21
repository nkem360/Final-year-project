import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from auth.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    store_refresh_token, revoke_refresh_token, validate_refresh_token,
    get_current_user,
)
from db_models.models import User
from db_models.crud.users import UserCRUD
from schema_models.user_schemas import (
    UserSignup, UserLogin, UserResponse,
    TokenResponse, TokenRefreshRequest, PasswordChangeRequest,
)
from custom_errors.exceptions import UserAlreadyExists, UserNotFound, TokenExpired, TokenInvalid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignup, db: Session = Depends(get_db)):
    """Register a new user account."""
    existing = UserCRUD.get_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    try:
        user = UserCRUD.create(
            db,
            username=payload.username,
            email=payload.email,
            hashed_password=hash_password(payload.password),
        )
        return user
    except UserAlreadyExists as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and receive access + refresh tokens."""
    user = UserCRUD.get_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    store_refresh_token(db, user.id, refresh_token)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh_tokens(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for new access + refresh tokens."""
    try:
        user_id = validate_refresh_token(db, payload.refresh_token)
    except (TokenExpired, TokenInvalid) as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    # Rotate: revoke old, issue new
    revoke_refresh_token(db, payload.refresh_token)
    new_access = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)
    store_refresh_token(db, user_id, new_refresh)

    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    """Revoke the provided refresh token."""
    revoke_refresh_token(db, payload.refresh_token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change the current user's password."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    UserCRUD.update_password(db, current_user.id, hash_password(payload.new_password))


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently delete the current user's account and all associated data."""
    UserCRUD.delete(db, current_user.id)
