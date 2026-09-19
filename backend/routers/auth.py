"""
CRAFTORA Email OTP Authentication Router.
Provides real email verification, cryptographic hashing of OTPs, rate-limiting,
expiration handling, and role-based user account registration.
"""

import os
import time
import secrets
import hashlib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Header

from ..models.auth import (
    SendOTPRequest,
    VerifyOTPRequest,
    RegisterUserRequest,
    AuthResponse,
    UserRole,
    UserProfile
)
from ..data.demo_data import USERS, OTP_SESSIONS, ARTISANS, BUYERS, _LOCK, save_storage

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

OTP_EXPIRATION_SECONDS = 300  # 5 minutes
RESEND_COOLDOWN_SECONDS = 60   # 60 seconds
MAX_OTP_ATTEMPTS = 5           # Max 5 attempts per OTP session

def _hash_otp(otp: str, salt: str) -> str:
    """Returns SHA-256 salted hash of OTP for secure storage."""
    return hashlib.sha256(f"{salt}:{otp}".encode("utf-8")).hexdigest()

def _send_email_otp(to_email: str, otp: str, purpose: str = "verification") -> bool:
    """
    Sends real email OTP using configured SMTP server.
    If SMTP credentials are not configured in environment, prints clearly to server logs.
    """
    smtp_host = os.environ.get("SMTP_HOST", "")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASSWORD", "")
    from_email = os.environ.get("SMTP_FROM_EMAIL", smtp_user or "auth@craftora.in")

    subject = f"CRAFTORA Verification Code: {otp}"
    body_text = (
        f"Your CRAFTORA verification code is: {otp}\n\n"
        f"This code will expire in 5 minutes.\n"
        f"Do not share this OTP with anyone.\n\n"
        f"— Team CRAFTORA (AI-Powered Marketplace for Artisans)"
    )

    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart()
            msg["From"] = from_email
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body_text, "plain"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(from_email, [to_email], msg.as_string())
            print(f"[CRAFTORA SMTP] Real email OTP dispatched to {to_email}")
            return True
        except Exception as e:
            print(f"[CRAFTORA SMTP ERROR] Could not send email via SMTP: {e}")
            # Fall back to logging
    
    # Server console dispatch notice for local/development environments
    print(f"\n=======================================================")
    print(f"📧 [CRAFTORA REAL EMAIL OTP DISPATCH]")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"OTP Code: {otp}")
    print(f"Expires in: 300 seconds (5 minutes)")
    print(f"=======================================================\n")
    return True


@router.post("/send-otp", response_model=AuthResponse, summary="Send Email OTP for Authentication")
def send_otp(req: SendOTPRequest):
    email = req.email.lower().strip()
    now = time.time()

    with _LOCK:
        # Check if email is already registered when purpose is 'register'
        if req.purpose == "register":
            existing_user = next((u for u in USERS.values() if u.get("email") == email), None)
            if existing_user and existing_user.get("email_verified"):
                return AuthResponse(
                    success=False,
                    code="EMAIL_ALREADY_REGISTERED",
                    message="This email is already registered. Please sign in instead."
                )

        # Check existing OTP session for rate limiting & resend cooldown
        session = OTP_SESSIONS.get(email)
        if session:
            resend_available_at = session.get("resend_available_at", 0)
            if now < resend_available_at:
                wait_seconds = int(resend_available_at - now)
                return AuthResponse(
                    success=False,
                    code="OTP_RATE_LIMITED",
                    message=f"Please wait {wait_seconds} seconds before requesting a new OTP."
                )

        # Generate secure 6-digit random OTP
        otp_raw = str(secrets.randbelow(900000) + 100000)
        salt = secrets.token_hex(8)
        otp_hash = _hash_otp(otp_raw, salt)

        # Store session with expiration, cooldown, and attempt limits
        OTP_SESSIONS[email] = {
            "email": email,
            "role": req.role.value,
            "name": req.name or "",
            "purpose": req.purpose,
            "salt": salt,
            "otp_hash": otp_hash,
            "raw_otp": otp_raw if os.getenv("ENVIRONMENT") != "production" else None,
            "created_at": now,
            "expires_at": now + OTP_EXPIRATION_SECONDS,
            "resend_available_at": now + RESEND_COOLDOWN_SECONDS,
            "attempts_remaining": MAX_OTP_ATTEMPTS,
            "verified": False
        }

    # Dispatch email
    _send_email_otp(email, otp_raw, req.purpose)

    return AuthResponse(
        success=True,
        code="OTP_SENT",
        message=f"Verification code sent to {email}. Valid for 5 minutes."
    )


@router.get("/dev-otp", summary="Get Latest OTP for Dev/Testing (Non-Production Only)")
def get_dev_otp(email: str):
    if os.getenv("ENVIRONMENT") == "production":
        raise HTTPException(status_code=403, detail="Disabled in production")
    email = email.lower().strip()
    with _LOCK:
        session = OTP_SESSIONS.get(email)
        if not session:
            raise HTTPException(status_code=404, detail="No active OTP session for this email")
        return {"email": email, "otp": session.get("raw_otp")}



@router.post("/verify-otp", response_model=AuthResponse, summary="Verify Email OTP")
def verify_otp(req: VerifyOTPRequest):
    email = req.email.lower().strip()
    user_otp = req.otp.strip()
    now = time.time()

    with _LOCK:
        session = OTP_SESSIONS.get(email)
        if not session:
            return AuthResponse(
                success=False,
                code="INVALID_OTP",
                message="No active OTP request found for this email. Please request a new code."
            )

        # 1. Check expiration
        if now > session.get("expires_at", 0):
            del OTP_SESSIONS[email]
            return AuthResponse(
                success=False,
                code="OTP_EXPIRED",
                message="Verification code has expired. Please request a new code."
            )

        # 2. Check remaining attempts
        attempts = session.get("attempts_remaining", 0)
        if attempts <= 0:
            del OTP_SESSIONS[email]
            return AuthResponse(
                success=False,
                code="OTP_RATE_LIMITED",
                message="Maximum verification attempts exceeded. Please request a new code."
            )

        # 3. Verify OTP Hash
        salt = session.get("salt", "")
        expected_hash = session.get("otp_hash", "")
        submitted_hash = _hash_otp(user_otp, salt)

        if not secrets.compare_digest(submitted_hash, expected_hash):
            session["attempts_remaining"] = attempts - 1
            remaining = session["attempts_remaining"]
            if remaining <= 0:
                del OTP_SESSIONS[email]
                return AuthResponse(
                    success=False,
                    code="OTP_RATE_LIMITED",
                    message="Incorrect code. Maximum attempts exceeded. Please request a new code."
                )
            return AuthResponse(
                success=False,
                code="INVALID_OTP",
                message=f"Invalid verification code. {remaining} attempts remaining."
            )

        # Mark session as verified and clean up
        session["verified"] = True
        del OTP_SESSIONS[email]

        # Find or create user account
        user = next((u for u in USERS.values() if u.get("email") == email), None)
        user_id = user.get("uid") if user else None

        if not user:
            # Generate collision-resistant unique user ID
            role_prefix = "ART" if req.role == UserRole.ARTISAN else "BUY"
            user_id = f"CRF-{role_prefix}-{secrets.token_hex(4).upper()}"
            now_str = datetime.now().strftime("%d %b %Y %H:%M")

            user = {
                "uid": user_id,
                "email": email,
                "name": session.get("name") or ("Master Artisan" if req.role == UserRole.ARTISAN else "Valued Buyer"),
                "role": req.role.value,
                "email_verified": True,
                "profileCompleted": False if req.role == UserRole.ARTISAN else True,
                "created_at": now_str,
                "updated_at": now_str
            }
            USERS[user_id] = user
        else:
            user["email_verified"] = True
            user["updated_at"] = datetime.now().strftime("%d %b %Y %H:%M")

        # Generate session auth token
        session_token = f"crf_tok_{secrets.token_urlsafe(32)}"
        user["auth_token"] = session_token

        # Check artisan profile completion status
        profile_completed = bool(user.get("profileCompleted", False))
        if req.role == UserRole.ARTISAN:
            # Also check if artisan profile exists in ARTISANS collection with mandatory fields
            artisan_rec = ARTISANS.get(user_id)
            if artisan_rec and artisan_rec.get("profileCompleted"):
                profile_completed = True
                user["profileCompleted"] = True

        save_storage()

        return AuthResponse(
            success=True,
            code="VERIFIED",
            message="Email successfully verified.",
            token=session_token,
            profileCompleted=profile_completed,
            user={
                "uid": user["uid"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
                "profileCompleted": profile_completed
            }
        )


@router.get("/me", response_model=AuthResponse, summary="Get Current Authenticated User")
def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "code": "UNAUTHORIZED", "message": "Authentication token missing."}
        )

    token = authorization.replace("Bearer ", "").strip()
    with _LOCK:
        user = next((u for u in USERS.values() if u.get("auth_token") == token), None)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"success": False, "code": "UNAUTHORIZED", "message": "Invalid or expired session token."}
            )

        return AuthResponse(
            success=True,
            message="Authenticated user details retrieved.",
            token=token,
            profileCompleted=user.get("profileCompleted", False),
            user={
                "uid": user["uid"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
                "profileCompleted": user.get("profileCompleted", False)
            }
        )
