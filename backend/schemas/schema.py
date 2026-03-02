from pydantic import BaseModel, Field, field_serializer
from typing import Optional
from uuid import UUID


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(...)
    password: str = Field(..., min_length=8, max_length=72)


class UserLogin(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=72)


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    image_url: Optional[str] = None
    role: str

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    class Config:
        from_attributes = True


class DeleteUserRequest(BaseModel):
    password: str = Field(..., min_length=8, max_length=72)
    confirm_delete: bool = Field(...,
                                 description="Must be True to confirm account deletion")


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class TokenResponse(BaseModel):
    type: str
    access_token: str
    refresh_token: str


class UserPasswordResetRequest(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=72)
    confirm_password: str = Field(..., min_length=8, max_length=72)


class PasswordCreate(BaseModel):
    service_name: str = Field(..., min_length=1)
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)


class PasswordResponse(BaseModel):
    id: UUID
    service_name: str
    username: str
    password: str

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    class Config:
        from_attributes = True


class PasswordUpdate(BaseModel):
    service_name: Optional[str] = Field(None, min_length=1)
    username: Optional[str] = Field(None, min_length=3)
    password: Optional[str] = Field(None, min_length=8, max_length=72)


class AllPasswordsResponse(BaseModel):
    passwords: list[PasswordResponse]


class TokenValidationRequest(BaseModel):
    token: str


class UpdateUserPasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=8, max_length=72)
    new_password: str = Field(..., min_length=8, max_length=72)
    confirm_password: str = Field(..., min_length=8, max_length=72)


class CreatePasswordRequest(BaseModel):
    service_name: str = Field(..., min_length=1)
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)


class UpdatePasswordRequest(BaseModel):
    service_name: Optional[str] = Field(None, min_length=1)
    username: Optional[str] = Field(None, min_length=3)
    password: Optional[str] = Field(None, min_length=8, max_length=72)


class GetPasswordResponse(BaseModel):
    id: UUID
    user_id: UUID
    service_name: str
    username: str
    password: str

    @field_serializer('id', 'user_id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    class Config:
        from_attributes = True


class CreateServiceRequest(BaseModel):
    name: str = Field(..., min_length=1)
    image_url: Optional[str] = Field(None)


class ServiceResponse(BaseModel):
    id: UUID
    name: str
    image_url: Optional[str] = None

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    class Config:
        from_attributes = True
