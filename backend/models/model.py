from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, UUID
from sqlalchemy.orm import relationship
from core.database import Base
from uuid import uuid4


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True,
                index=True, default=uuid4)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    image_url = Column(String)
    role = Column(String, default="user", nullable=False)

    tokens = relationship("AuthToken", back_populates="user",
                          cascade="all, delete-orphan")
    passwords = relationship(
        "Passwords", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship(
        "PasswordResetToken", back_populates="user", cascade="all, delete-orphan")


class AuthToken(Base):
    __tablename__ = "auth_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True,
                index=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id"), nullable=False)
    token = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="tokens")


class Services(Base):
    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True,
                index=True, default=uuid4)
    name = Column(String, unique=True, nullable=False)
    image_url = Column(String, nullable=True)


class Passwords(Base):
    __tablename__ = "passwords"

    id = Column(UUID(as_uuid=True), primary_key=True,
                index=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id"), nullable=False)
    service_name = Column(String, ForeignKey("services.name"), nullable=False)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)

    user = relationship("User", back_populates="passwords")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True,
                index=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id"), nullable=False)
    token = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="password_reset_tokens")
