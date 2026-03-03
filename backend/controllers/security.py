import hmac
import base64
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Dict
from core.config import CONFIG

JWT_SECRET_KEY = CONFIG.JWT_SECRET_KEY
JWT_ALGORITHM = CONFIG.JWT_ALGORITHM
JWT_ISSUER = CONFIG.JWT_ISSUER
JWT_AUDIENCE = CONFIG.JWT_AUDIENCE
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = CONFIG.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
JWT_REFRESH_TOKEN_EXPIRE_DAYS = CONFIG.JWT_REFRESH_TOKEN_EXPIRE_DAYS


def create_jwt_token(data: Dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=data.get("expire",
                                                            JWT_ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "exp": expire,
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        **to_encode
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


def b64u_to_bytes(b64u: str) -> bytes:
    rem = len(b64u) % 4
    if rem:
        b64u += '=' * (4 - rem)
    return base64.urlsafe_b64decode(b64u)


def safe_compare(a: bytes, b: bytes) -> bool:
    return hmac.compare_digest(a, b)


def verify_jwt_token(token: str) -> Dict:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[
                             JWT_ALGORITHM], audience=JWT_AUDIENCE, issuer=JWT_ISSUER)

        return payload
    except JWTError as e:
        raise ValueError("Invalid token: " + str(e))


def verify_valid_user(token: str) -> Dict:
    payload = verify_jwt_token(token)
    if "uid" not in payload or "sub" not in payload:
        raise ValueError("Invalid token: missing required claims")

    if payload.get("type") == "refresh":
        raise ValueError(
            "Invalid token: refresh tokens cannot be used for authentication")

    return payload
