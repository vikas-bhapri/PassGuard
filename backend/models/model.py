from datetime import datetime

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
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow, nullable=True)
    new_user = Column(Boolean, default=True, nullable=False)
    master_password_set = Column(Boolean, default=False, nullable=False)

    # Auth (challenge–response)
    auth_algo = Column(String, nullable=True)           # "Argon2id-13"
    auth_ops_limit = Column(Integer, nullable=True)
    auth_mem_limit_kib = Column(Integer, nullable=True)
    auth_salt_b64u = Column(String, nullable=True)
    auth_verifier_b64u = Column(String, nullable=True)  # 32B key (base64url)

    # Vault KDF
    vault_algo = Column(String, nullable=True)
    vault_ops_limit = Column(Integer, nullable=True)
    vault_mem_limit_kib = Column(Integer, nullable=True)
    vault_salt_b64u = Column(String, nullable=True)

    tokens = relationship("AuthToken", back_populates="user",
                          cascade="all, delete-orphan")
    passwords = relationship(
        "Passwords", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship(
        "PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    todo_lists = relationship(
        "ToDoList", back_populates="user", cascade="all, delete-orphan")


class AuthToken(Base):
    __tablename__ = "auth_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True,
                index=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id"), nullable=False, index=True)
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
    service_name = Column(String, nullable=False)
    username = Column(String, nullable=False)
    ciphertext_b64u = Column(String, nullable=False)
    iv_b64u = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow, nullable=True)
    is_favorite = Column(Boolean, default=False, nullable=False)

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


class ToDoList(Base):
    __tablename__ = "todo_lists"

    id = Column(UUID(as_uuid=True), primary_key=True,
                index=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    complete_by = Column(DateTime, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow, nullable=True)

    user = relationship("User", back_populates="todo_lists")
