from core.database import get_db
from fastapi import APIRouter, Depends, Header, status, Response, Request, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from schemas.schema import (
    TokenResponse,
    RegisterRequest,
    UserResponse,
    UserUpdate,
    UpdateUserPasswordRequest,
    DeleteUserRequest,
    UserPasswordResetRequest,
    ChallengeResponse,
    LoginVerifyRequest
)
from controllers import auth, login
from core.config import CONFIG

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: RegisterRequest, db: Session = Depends(get_db)):
    return auth.register_user(user, db)


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    result = login.login_user(form_data, db)
    response = Response(content=result.json(), media_type="application/json")

    # Use secure cookies only in production, allow cross-site for development
    is_production = CONFIG.APP_ENV.lower() == "production"

    response.set_cookie(
        key="access_token",
        value=result.access_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=CONFIG.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    response.set_cookie(
        key="refresh_token",
        value=result.refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=CONFIG.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    return response


@router.get("/login/challenge", response_model=ChallengeResponse, status_code=status.HTTP_200_OK)
def login_challenge(username: str, db: Session = Depends(get_db)):
    return login.login_challenge(username, db)


@router.post("/login/verify", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login_verify(request: LoginVerifyRequest, db: Session = Depends(get_db)):
    result = login.login_verify(request, db)
    response = Response(content=result.json(), media_type="application/json")

    # Use secure cookies only in production, allow cross-site for development
    is_production = CONFIG.APP_ENV.lower() == "production"
    response.set_cookie(
        key="access_token",
        value=result.access_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=CONFIG.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    response.set_cookie(
        key="refresh_token",
        value=result.refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=CONFIG.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    return response


@router.get("/validate_user", status_code=status.HTTP_200_OK)
def validate_user(token: str = Depends(login.oauth2_scheme)):
    return login.validate_user(token)


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(request: Request):
    response = Response(content='{"message": "Logged out successfully"}', media_type="application/json")
    
    # Delete cookies by setting them to expire immediately
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    
    return response


@router.get("/", status_code=status.HTTP_200_OK, response_model=UserResponse)
def get_user(db: Session = Depends(get_db), user_id: dict = Depends(login.validate_user)):
    return auth.get_user(user_id["uid"], db)


@router.patch("/", response_model=UserResponse, status_code=status.HTTP_200_OK)
def update_user(user: UserUpdate, db: Session = Depends(get_db), user_id: dict = Depends(login.validate_user)):
    return auth.update_user(user_id["uid"], user, db)


@router.put("/update_password/", response_model=UserResponse, status_code=status.HTTP_200_OK)
def update_password(password_update: UpdateUserPasswordRequest, db: Session = Depends(get_db), user_id: dict = Depends(login.validate_user)):
    return auth.update_password(user_id["uid"], password_update, db)


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(request_body: DeleteUserRequest, db: Session = Depends(get_db), user_id: dict = Depends(login.validate_user)):
    auth.delete_user(request_body, user_id["uid"], db)
    return None


@router.get("/refresh_token", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def refresh_token(request: Request, db: Session = Depends(get_db)):
    # Try to get refresh token from cookies first, then from Authorization header
    refresh_token_value = request.cookies.get("refresh_token")
    
    if not refresh_token_value:
        # Fall back to Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header:
            refresh_token_value = auth_header.replace("Bearer ", "")
    
    if not refresh_token_value:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                          detail="Refresh token missing")
    
    return login.refresh_access_token(refresh_token_value, db)


@router.post("/password_reset_request", status_code=status.HTTP_200_OK)
def password_reset_request(email: str, db: Session = Depends(get_db)):
    return auth.password_reset_request(email, db)


@router.post("/reset_password", status_code=status.HTTP_200_OK)
def password_reset(reset_token: str, passwords: UserPasswordResetRequest, db: Session = Depends(get_db)):
    return auth.password_reset(reset_token, passwords, db)


@router.get("/me/kdf", status_code=status.HTTP_200_OK)
def me_kdf(db: Session = Depends(get_db), user_id: dict = Depends(login.validate_user)):
    return auth.get_user_kdf_params(user_id["uid"], db)
