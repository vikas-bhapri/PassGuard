from models.model import User, PasswordResetToken
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from schemas import schema
from bcrypt import hashpw, gensalt, checkpw
from re import match
from uuid import UUID
from .email import send_email
import hashlib
import secrets
from datetime import datetime, timedelta
from core.config import CONFIG

FRONTEND_URL = CONFIG.FRONTEND_URL


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


def get_user(user_id: UUID, db: Session):
    existing_user = db.query(User).filter(User.id == user_id).first()

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return existing_user


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


def delete_user(request_body: schema.DeleteUserRequest, user_id: UUID, db: Session):
    existing_user = db.query(User).filter(User.id == user_id).first()

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not request_body.confirm_delete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Account deletion not confirmed")

    if not checkpw(request_body.password.encode('utf-8'), existing_user.hashed_password.encode('utf-8')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Password is incorrect")

    db.delete(existing_user)
    db.commit()
    return {"detail": "User deleted successfully"}


def password_reset_request(email: str, db: Session):
    if not validate_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format")

    if not FRONTEND_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Frontend URL not configured")

    existing_user = db.query(User).filter(User.email == email).first()

    if not existing_user:
        return {"detail": "If the email exists, a password reset token has been sent"}

    # Generate a password reset token
    reset_token = secrets.token_urlsafe(32)
    hashed_token = hashlib.sha256(reset_token.encode('utf-8')).hexdigest()

    # Store the hashed token in the database with an expiration time (e.g., 1 hour)
    new_reset_token = PasswordResetToken(
        user_id=existing_user.id, token=hashed_token, expires_at=datetime.utcnow() +
        timedelta(hours=1)
    )
    db.add(new_reset_token)
    db.commit()
    db.refresh(new_reset_token)

    send_email(
        subject="MyPasswordManager - Password Reset Request",
        body=f"""
        <html>
          <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
              <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background:#2f6fed;color:#ffffff;padding:20px 24px;font-size:20px;font-weight:bold;">
                Password Reset Request
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px;color:#333333;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;">Hi,</p>
                <p style="margin:0 0 20px;">
                  We received a request to reset your password. Click the button below to continue.
                </p>
                <p style="margin:0 0 24px;text-align:center;">
                  <a href="{FRONTEND_URL}/reset-password?token={reset_token}"
                     style="display:inline-block;background:#2f6fed;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold;">
                    Reset Password
                  </a>
                </p>
                <p style="margin:0 0 12px;font-size:13px;color:#666666;">
                  This link expires in 1 hour.
                </p>
                <p style="margin:0;font-size:13px;color:#666666;">
                  If you did not request this, you can safely ignore this email.
                </p>
                  </td>
                </tr>
              </table>
            </td>
              </tr>
            </table>
          </body>
        </html>
        """,
        recipient_email=str(existing_user.email)
    )

    return {"detail": "If the email exists, a password reset token has been sent"}


def password_reset(reset_token: str, data: schema.UserPasswordResetRequest, db: Session):
    hashed_token = hashlib.sha256(reset_token.encode('utf-8')).hexdigest()

    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == hashed_token).first()

    if not token_record or token_record.expires_at < datetime.utcnow() or token_record.used:  # type: ignore
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid or expired reset token")

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    setattr(user, "auth_salt_b64u", data.auth_salt_b64u)
    setattr(user, "auth_verifier_b64u", data.auth_verifier_b64u)
    setattr(user, "vault_salt_b64u", data.vault_salt_b64u)

    setattr(token_record, "used", True)

    db.commit()
    db.refresh(user)
    return {"detail": "Password reset successful"}


def register_user(user: schema.RegisterRequest, db: Session):
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)).first()

    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Username or email already exists")

    if not validate_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format")

    new_user = User(
        email=user.email,
        username=user.username,
        auth_algo=user.auth_algo,
        auth_iterations=user.auth_iterations,
        auth_salt_b64u=user.auth_salt_b64u,
        auth_verifier_b64u=user.auth_verifier_b64u,

        vault_algo=user.vault_kdf.algo,
        vault_iterations=user.vault_kdf.iterations,
        vault_salt_b64u=user.vault_kdf.salt_b64u
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def get_user_kdf_params(user_id: UUID, db: Session):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {
        "vault_kdf": {
            "algo": user.vault_algo,
            "iterations": user.vault_iterations,
            "salt_b64u": user.vault_salt_b64u,
        }
    }
