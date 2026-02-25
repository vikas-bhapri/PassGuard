from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from schemas.schema import (
    CreatePasswordRequest,
    UpdatePasswordRequest,
    GetPasswordResponse
)
from config.database import get_db
from controllers import password
from .auth import validate_user
from uuid import UUID

router = APIRouter(
    prefix="/passwords",
    tags=["Passwords"]
)


@router.post("/", response_model=GetPasswordResponse, status_code=status.HTTP_201_CREATED)
def create_password(password_request: CreatePasswordRequest, db: Session = Depends(get_db), user_id: UUID = Depends(validate_user)):
    return password.create_password(password_request, db, user_id)


@router.get("/", response_model=list[GetPasswordResponse], status_code=status.HTTP_200_OK)
def get_user_passwords(user_id: UUID = Depends(validate_user), db: Session = Depends(get_db)):
    return password.get_user_passwords(user_id, db)


@router.put("/{password_id}", response_model=GetPasswordResponse, status_code=status.HTTP_200_OK)
def update_password(password_id: str, password_update: UpdatePasswordRequest, db: Session = Depends(get_db), user_id: UUID = Depends(validate_user)):
    return password.update_password(UUID(password_id), password_update, db, user_id)


@router.get("/{password_id}", response_model=GetPasswordResponse, status_code=status.HTTP_200_OK)
def get_password(password_id: str, db: Session = Depends(get_db), user_id: UUID = Depends(validate_user)):
    return password.get_password(UUID(password_id), db, user_id)


@router.delete("/{password_id}", status_code=status.HTTP_200_OK)
def delete_password(password_id: str, db: Session = Depends(get_db), user_id: UUID = Depends(validate_user)):
    return password.delete_password(UUID(password_id), db, user_id)
