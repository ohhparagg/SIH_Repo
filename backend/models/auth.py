"""
CRAFTORA Authentication Models & Schemas.
Supports Email OTP verification, role management (ADMIN, ARTISAN, BUYER),
and user profile tracking.
"""

from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    ADMIN = "admin"
    ARTISAN = "artisan"
    BUYER = "buyer"


class SendOTPRequest(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.ARTISAN
    name: Optional[str] = None
    purpose: str = Field(default="register", description="'register' or 'signin'")


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str
    role: UserRole = UserRole.ARTISAN


class RegisterUserRequest(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.ARTISAN
    phone: Optional[str] = None


class UserProfile(BaseModel):
    uid: str
    email: str
    name: str
    role: UserRole
    phone: Optional[str] = None
    email_verified: bool = True
    profile_completed: bool = False
    created_at: str
    updated_at: str


class AuthResponse(BaseModel):
    success: bool
    code: Optional[str] = None
    message: str
    token: Optional[str] = None
    user: Optional[Dict[str, Any]] = None
    profileCompleted: Optional[bool] = False
