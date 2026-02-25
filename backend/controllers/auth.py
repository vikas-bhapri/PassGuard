from models.model import User
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from schemas import schema
from bcrypt import hashpw, gensalt, checkpw
from re import match
from uuid import UUID


def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = gensalt(prefix=b'2b', rounds=10)
    hashed = hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def validate_email(email: str) -> bool:
    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9.]+$'
    return match(email_regex, email) is not None


def create_user(user: schema.UserCreate, db: Session):
    # Check if the username or email already exists
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Username or email already exists")

    if not validate_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format")

    hashed_password = hash_password(user.password)
    new_user = User(username=user.username, email=user.email,
                    hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def update_user(user_id: UUID, user_update: schema.UserUpdate, db: Session):
    existing_user = db.query(User).filter(User.id == user_id).first()

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    for field, value in user_update.dict(exclude_unset=True).items():
        if value is not None:
            setattr(existing_user, field, value)

    db.commit()
    db.refresh(existing_user)
    return existing_user


def update_password(user_id: UUID, password_update: schema.UpdateUserPasswordRequest, db: Session):
    existing_user = db.query(User).filter(User.id == user_id).first()

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not checkpw(password_update.old_password.encode('utf-8'), existing_user.hashed_password.encode('utf-8')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Old password is incorrect")

    if password_update.new_password != password_update.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="New password and confirm password do not match")

    hashed_password = hash_password(password_update.new_password)
    setattr(existing_user, "hashed_password", hashed_password)
    db.commit()
    db.refresh(existing_user)
    return existing_user
