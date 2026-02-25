from config.database import get_db
from fastapi import APIRouter, Depends, Header, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from schemas.schema import (
    TokenResponse,
    UserCreate,
    UserResponse,
    UserUpdate,
    UpdateUserPasswordRequest,
    DeleteUserRequest
)
from controllers import auth, login
from uuid import UUID
from typing import Annotated

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    return auth.create_user(user, db)


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return login.login_user(form_data, db)


@router.get("/validate_user", status_code=status.HTTP_200_OK)
def validate_user(token: str = Depends(login.oauth2_scheme)):
    return login.validate_user(token)


@router.patch("/", response_model=UserResponse, status_code=status.HTTP_200_OK)
def update_user(user: UserUpdate, db: Session = Depends(get_db), user_id=Depends(login.validate_user)):
    return auth.update_user(user_id, user, db)


@router.put("/update_password/", response_model=UserResponse, status_code=status.HTTP_200_OK)
def update_password(password_update: UpdateUserPasswordRequest, db: Session = Depends(get_db), user_id=Depends(login.validate_user)):
    return auth.update_password(user_id, password_update, db)


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(request_body: DeleteUserRequest, db: Session = Depends(get_db), user_id=Depends(login.validate_user)):
    auth.delete_user(request_body, user_id, db)
    return None


@router.get("/refresh_token", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def refresh_token(Authorization: Annotated[str | None, Header(...)], db: Session = Depends(get_db)):
    if Authorization is None:
        raise auth.HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                 detail="Authorization header missing")
    access_token = Authorization
    return login.refresh_access_token(access_token, db)
