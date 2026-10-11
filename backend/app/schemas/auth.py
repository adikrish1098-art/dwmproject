from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
    role: str
    username: str
    full_name: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    type: Optional[str] = None

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class SignupRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    confirm_password: str
    phone_number: Optional[str] = None
    terms_acknowledged: bool = Field(..., description="User must acknowledge terms")

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)
    confirm_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)
    confirm_password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
