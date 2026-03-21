from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from core.database import get_db
from core.settings import get_jwt_settings
from db_models.models import User, RefreshToken
from db_models.crud.users import UserCRUD
from custom_errors.exceptions import InvalidCredentials, TokenExpired, TokenInvalid

_jwt = get_jwt_settings()
SECRET_KEY = _jwt["SECRET_KEY"]
ALGORITHM = _jwt["ALGORITHM"]
ACCESS_TOKEN_EXPIRE_MINUTES = _jwt["ACCESS_TOKEN_EXPIRE_MINUTES"]
REFRESH_TOKEN_EXPIRE_DAYS = _jwt["REFRESH_TOKEN_EXPIRE_DAYS"]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


# ─── Password helpers ────────────────────────────────────────────────────────


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ─── Token creation ──────────────────────────────────────────────────────────


def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire, "type": "access"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(user_id), "exp": expire, "type": "refresh"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise TokenExpired("Token has expired")
    except JWTError:
        raise TokenInvalid("Invalid token")


# ─── Refresh token DB management ─────────────────────────────────────────────


def store_refresh_token(db: Session, user_id: int, token: str) -> None:
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    rt = RefreshToken(user_id=user_id, token=token, expires_at=expire)
    db.add(rt)
    db.commit()


def revoke_refresh_token(db: Session, token: str) -> None:
    rt = db.query(RefreshToken).filter(RefreshToken.token == token).first()
    if rt:
        rt.is_revoked = True
        db.commit()


def validate_refresh_token(db: Session, token: str) -> int:
    """Returns user_id if token is valid, raises otherwise."""
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise TokenInvalid("Not a refresh token")

    rt = db.query(RefreshToken).filter(
        RefreshToken.token == token,
        RefreshToken.is_revoked == False,
    ).first()
    if not rt:
        raise TokenInvalid("Refresh token revoked or not found")
    if rt.expires_at < datetime.utcnow():
        raise TokenExpired("Refresh token expired")

    return int(payload["sub"])


# ─── FastAPI dependencies ─────────────────────────────────────────────────────


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Require a valid JWT. Raises 401 if missing or invalid."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise TokenInvalid("Not an access token")
        user_id = int(payload["sub"])
    except (TokenExpired, TokenInvalid) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = UserCRUD.get_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Return the user if authenticated, or None for anonymous requests."""
    if not credentials:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None
