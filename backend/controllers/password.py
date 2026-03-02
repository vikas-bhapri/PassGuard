from fastapi import HTTPException, status
from models.model import Passwords, Services
from sqlalchemy.orm import Session
from schemas.schema import (
    CreatePasswordRequest,
    UpdatePasswordRequest
)
from uuid import UUID


def create_password(password_request: CreatePasswordRequest, db: Session, user_id: UUID):
    # Standardize service name to capitalized format
    standardized_service_name = str(password_request.service_name).capitalize()

    # Check if service exists, if not create it
    service_exists = db.query(Services).filter(
        Services.name == standardized_service_name
    ).first()

    if not service_exists:
        new_service = Services(name=standardized_service_name)
        db.add(new_service)
        db.commit()
        db.refresh(new_service)

    # Create password with standardized service name
    new_password = Passwords(
        user_id=user_id,
        service_name=standardized_service_name,
        username=password_request.username,
        password=password_request.password
    )

    db.add(new_password)
    db.commit()
    db.refresh(new_password)
    return new_password


def update_password(password_id: UUID, password_update: UpdatePasswordRequest, db: Session, user_id: UUID):
    existing_password = db.query(Passwords).filter(
        Passwords.id == password_id, Passwords.user_id == user_id).first()

    if not existing_password:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Password entry not found")

    for field, value in password_update.model_dump(exclude_unset=True).items():
        setattr(existing_password, field, value)

    db.commit()
    db.refresh(existing_password)
    return existing_password


def get_password(password_id: UUID, db: Session, user_id: UUID):
    password_entry = db.query(Passwords).filter(
        Passwords.id == password_id, Passwords.user_id == user_id).first()

    if not password_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Password entry not found")

    return password_entry


def delete_password(password_id: UUID, db: Session, user_id: UUID):
    password_entry = db.query(Passwords).filter(
        Passwords.id == password_id, Passwords.user_id == user_id).first()

    if not password_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Password entry not found")

    db.delete(password_entry)
    db.commit()
    return {"detail": "Password entry deleted successfully"}


def get_user_passwords(user_id, db: Session):
    user_passwords = db.query(Passwords).filter(
        Passwords.user_id == user_id).all()

    if not user_passwords:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="No password entries found for this user")

    return user_passwords
