import logging
import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from database import get_db
from models import User
from schemas.auth import LoginRequest
from schemas.user import UserOut
from auth.jwt import create_access_token, get_current_user, EXPIRE_MIN
import os

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = logging.getLogger(__name__)

# ── In-memory rate limiter (5 attempts per 60 seconds per IP) ────────────────
_login_attempts: dict[str, list[float]] = defaultdict(list)
_RATE_WINDOW = 60   # seconds
_RATE_MAX    = 5    # max attempts per window


def _check_rate_limit(ip: str) -> None:
    now = time.time()
    _login_attempts[ip] = [t for t in _login_attempts[ip] if now - t < _RATE_WINDOW]
    if len(_login_attempts[ip]) >= _RATE_MAX:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Тым көп кіру әрекеті. 1 минут күтіңіз.",
        )
    _login_attempts[ip].append(now)


def _is_https_cookie() -> bool:
    return os.getenv("HTTPS_COOKIE", "false").lower() == "true"


@router.post("/login")
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    ip = (request.client.host or "unknown") if request.client else "unknown"
    _check_rate_limit(ip)

    user = db.query(User).filter(User.email == body.email).first()
    if not user or not pwd_context.verify(body.password, user.password_hash):
        logger.warning("Failed login attempt for email=%s ip=%s", body.email, ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token({"sub": str(user.id), "role": user.role})

    # Set httpOnly cookie — JavaScript cannot access this token
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=_is_https_cookie(),   # True in production (HTTPS)
        max_age=EXPIRE_MIN * 60,
        path="/",
    )
    return {"message": "Login successful"}


@router.post("/logout")
def logout(response: Response, _: User = Depends(get_current_user)):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
