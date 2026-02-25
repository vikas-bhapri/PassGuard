from models.model import User, AuthToken
from sqlalchemy.orm import Session
from schemas.schema import UserLogin, TokenResponse, TokenValidationRequest
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from bcrypt import checkpw
import os
from jose import jwt, JWTError
from dotenv import load_dotenv
from datetime import datetime, timedelta
from re import match
from typing import Union
from uuid import UUID

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv(
    "JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 15)
JWT_REFRESH_TOKEN_EXPIRE_DAYS = os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", 7)
JWT_ISSUER = os.getenv("JWT_ISSUER", "my_password_manager")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "my_password_manager_users")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


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
        {"sub": db_user.username, "iat": iat, "uid": str(db_user.id)}, access_token_expires)
    refresh_token = generate_token(
        {"sub": db_user.username, "type": "refresh", "iat": iat, "uid": str(db_user.id)}, refresh_token_expires)

    new_refresh_token_record = AuthToken(user_id=db_user.id, token=refresh_token, expires_at=(
        datetime.utcnow() + timedelta(seconds=refresh_token_expires)))

    # Delete the old refresh tokens for the user
    db.query(AuthToken).filter(AuthToken.user_id == db_user.id).delete()

    # Add the new refresh token to the database
    db.add(new_refresh_token_record)
    db.commit()
    db.refresh(new_refresh_token_record)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token, type="bearer")

# Validates the token and returns the username if valid, otherwise raises an HTTPException


def validate_user(token: str = Depends(oauth2_scheme)):
    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="JWT configuration error")

    try:
        # Decode the token and validate its claims
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[
                             JWT_ALGORITHM], audience=JWT_AUDIENCE, issuer=JWT_ISSUER)
        username = payload.get("sub")
        type = payload.get("type")
        user_id = payload.get("uid")

        # Ensure the token has a valid user_id and is not a refresh token
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        if type == "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        # Convert string user_id to UUID
        try:
            user_uuid = UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID in token")
        
        return user_uuid
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
