from os import getenv
from typing import Optional


def load_dotenv_if_present(filename: str = ".env") -> None:
    """
    Optional: load variables from a .env file if python-dotenv is installed.
    Safe no-op if the package is missing.
    """
    try:
        from dotenv import load_dotenv
    except Exception:
        return
    load_dotenv(dotenv_path=filename, override=False)


# Load .env file before reading environment variables
load_dotenv_if_present()


def _get_env_var(name: str, default: Optional[str] = None, required: bool = False) -> str:
    value = getenv(name, default)
    if required and value is None:
        raise ValueError(
            f"Environment variable '{name}' is required but not set.")
    return value  # type: ignore


class Config:
    DATABASE_CONNECTION_STRING: str = _get_env_var(
        "DATABASE_CONNECTION_STRING", required=True)
    JWT_SECRET_KEY: str = _get_env_var("JWT_SECRET_KEY", required=True)
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        _get_env_var("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = int(
        _get_env_var("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    JWT_ISSUER: str = _get_env_var("JWT_ISSUER", "my_password_manager")
    JWT_AUDIENCE: str = _get_env_var(
        "JWT_AUDIENCE", "my_password_manager_users")
    JWT_ALGORITHM: str = _get_env_var("JWT_ALGORITHM", "HS256")
    FRONTEND_URL: str = _get_env_var("FRONTEND_URL", "http://localhost:3000")
    AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING: Optional[str] = _get_env_var(
        "AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING")
    SENDER_EMAIL: Optional[str] = _get_env_var("SENDER_EMAIL")
    DEBUG: bool = _get_env_var("DEBUG", "False").lower() in ("true", "1", "t")
    APP_ENV: str = _get_env_var("APP_ENV", "development")
    
    # CORS Configuration
    # When using credentials, we cannot use wildcard "*"
    # Default to FRONTEND_URL if ALLOWED_HOSTS not specified
    _allowed_hosts_env = _get_env_var("ALLOWED_HOSTS", "")
    ALLOWED_HOSTS: list = (
        _allowed_hosts_env.split(",") if _allowed_hosts_env 
        else [_get_env_var("FRONTEND_URL", "http://localhost:3000")]
    )
    
    ALLOWED_HEADERS: list = _get_env_var(
        "ALLOWED_HEADERS", "Authorization,Content-Type").split(",")
    ALLOWED_METHODS: list = _get_env_var(
        "ALLOWED_METHODS", "GET,POST,PUT,DELETE,PATCH,OPTIONS").split(",")


CONFIG = Config()
