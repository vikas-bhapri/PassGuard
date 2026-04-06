import secrets
import base64
import hmac
import hashlib
from models.model import User, AuthToken
from sqlalchemy.orm import Session
from schemas.schema import UserLogin, TokenResponse, LoginVerifyRequest
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from bcrypt import checkpw
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Dict, Union, Optional
from core.config import CONFIG


JWT_SECRET_KEY = CONFIG.JWT_SECRET_KEY
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = CONFIG.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
JWT_REFRESH_TOKEN_EXPIRE_DAYS = CONFIG.JWT_REFRESH_TOKEN_EXPIRE_DAYS
JWT_ISSUER = CONFIG.JWT_ISSUER
JWT_AUDIENCE = CONFIG.JWT_AUDIENCE
JWT_ALGORITHM = CONFIG.JWT_ALGORITHM

# Make oauth2_scheme optional so it doesn't auto-error if Authorization header is missing
# We'll check cookies first in validate_user
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login", auto_error=False)


challenge_store: Dict[str, bytes] = {}


def generate_token(payload: dict, expires_delta: int) -> str:
    if not JWT_SECRET_KEY or not JWT_ISSUER or not JWT_AUDIENCE or not JWT_ACCESS_TOKEN_EXPIRE_MINUTES or not JWT_REFRESH_TOKEN_EXPIRE_DAYS:
        raise ValueError(
            "JWT configuration environment variables are not properly set.")
    to_encode = payload.copy()
    expire = datetime.utcnow() + timedelta(seconds=expires_delta)
    to_encode.update({"exp": expire, "iss": JWT_ISSUER, "aud": JWT_AUDIENCE})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY,
                             algorithm=JWT_ALGORITHM)
    return encoded_jwt


def login_user(user: Union[OAuth2PasswordRequestForm, UserLogin], db: Session) -> TokenResponse:
    # Find the user by username
    db_user = db.query(User).filter(User.username == user.username).first()

    if not db_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid username or password")

    # Verify the password
    if not checkpw(user.password.encode('utf-8'), db_user.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid username or password")

    # Generate and return a token
    access_token_expires = int(JWT_ACCESS_TOKEN_EXPIRE_MINUTES) * 60
    refresh_token_expires = int(JWT_REFRESH_TOKEN_EXPIRE_DAYS) * 24 * 60 * 60
    iat = datetime.utcnow()

    access_token = generate_token(
        {"sub": db_user.username, "iat": iat, "uid": str(db_user.id), "role": db_user.role}, access_token_expires)
    refresh_token = generate_token(
        {"sub": db_user.username, "type": "refresh", "iat": iat, "uid": str(db_user.id), "role": db_user.role}, refresh_token_expires)

    # Delete the old refresh tokens for the user
    db.query(AuthToken).filter(AuthToken.user_id == db_user.id).delete()

    # Add the new refresh token to the database
    new_refresh_token_record = AuthToken(user_id=db_user.id, token=refresh_token, expires_at=(
        datetime.utcnow() + timedelta(seconds=refresh_token_expires)))
    db.add(new_refresh_token_record)
    db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token, type="bearer")

# Validates the token and returns the username if valid, otherwise raises an HTTPException


def validate_user(request: Request, token: Optional[str] = Depends(oauth2_scheme)):
    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="JWT configuration error")

    # Try to get token from cookies first, then fall back to Authorization header
    access_token = request.cookies.get("access_token") or token

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No access token provided",
            headers={"WWW-Authenticate": "Bearer"}
        )

    try:
        # Decode the token and validate its claims
        payload = jwt.decode(access_token, JWT_SECRET_KEY, algorithms=[
                             JWT_ALGORITHM], audience=JWT_AUDIENCE, issuer=JWT_ISSUER)

        type = payload.get("type")
        user_id = payload.get("uid")

        # Ensure the token has a valid user_id and is not a refresh token
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        if type == "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def refresh_access_token(token: str, db: Session) -> TokenResponse:
    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="JWT configuration error")

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[
                             JWT_ALGORITHM], audience=JWT_AUDIENCE, issuer=JWT_ISSUER)
        user_id = payload.get("uid")
        token_type = payload.get("type")

        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        # Check if the refresh token exists in the database
        db_token = db.query(AuthToken).filter(
            AuthToken.token == token).first()

        if not db_token or db_token.expires_at < datetime.utcnow():  # type: ignore
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or invalid")

        # Generate a new access token
        access_token_expires = int(JWT_ACCESS_TOKEN_EXPIRE_MINUTES) * 60
        new_access_token = generate_token(
            {"sub": payload.get("sub"), "iat": datetime.utcnow(), "uid": user_id, "role": payload.get("role")}, access_token_expires)

        return TokenResponse(access_token=new_access_token, refresh_token=token, type="bearer")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def login_challenge(username: str, db: Session):
    user = db.query(User).filter(User.username == username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    challenge = secrets.token_bytes(32)
    challenge_store[str(user.username)] = challenge

    challenge_b64u = base64.urlsafe_b64encode(
        challenge).rstrip(b"=").decode('utf-8')

    return {
        "user_id": str(user.id),
        "username": user.username,
        "challenge_b64u": challenge_b64u,
        "auth_kdf": {
            "algo": user.auth_algo,
            "ops_limit": user.auth_ops_limit,
            "mem_limit_kib": user.auth_mem_limit_kib,
            "salt_b64u": user.auth_salt_b64u,
        },
        "vault_kdf": {
            "algo": user.vault_algo,
            "ops_limit": user.vault_ops_limit,
            "mem_limit_kib": user.vault_mem_limit_kib,
            "salt_b64u": user.vault_salt_b64u,
        }
    }


def login_verify(request: LoginVerifyRequest, db: Session):
    user = db.query(User).filter(User.username == request.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    expected_challenge = challenge_store.pop(str(user.username), None)
    if not expected_challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Challenge not found or already used")

    key = base64.urlsafe_b64decode(
        str(user.auth_verifier_b64u) + "==="[: (4 - len(str(user.auth_verifier_b64u)) % 4) % 4])
    sign = hmac.new(key, expected_challenge, hashlib.sha256).digest()
    proof_bytes = base64.urlsafe_b64decode(
        request.proof_b64u + "==="[: (4 - len(request.proof_b64u) % 4) % 4])

    if not hmac.compare_digest(sign, proof_bytes):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid proof")

    return {"status": "success", "message": "Verification successful"}
