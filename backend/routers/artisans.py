from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Header, Query
from ..models.artisan import (
    ArtisanCreate,
    ArtisanUpdate,
    ArtisanResponse,
    ArtisanDashboardStats,
    ArtisanProfileSetupRequest
)
from ..models.common import VerificationStatus
from ..data.demo_data import ARTISANS, PRODUCTS, INQUIRIES, USERS, _LOCK, save_storage

router = APIRouter(prefix="/api/artisans", tags=["Artisans"])

def _get_auth_user(authorization: Optional[str]) -> Optional[Dict[str, Any]]:
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    return next((u for u in USERS.values() if u.get("auth_token") == token), None)


@router.get("/profile", summary="Get Current Artisan Profile")
def get_artisan_profile(
    authorization: Optional[str] = Header(None),
    artisan_id: Optional[str] = Query(None)
):
    with _LOCK:
        user = _get_auth_user(authorization)
        target_id = artisan_id or (user.get("uid") if user else None)
        
        if not target_id and not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"success": False, "code": "UNAUTHORIZED", "message": "Authentication required."}
            )

        art = ARTISANS.get(target_id)
        if not art:
            # Check if user exists in USERS collection
            if user and user.get("role") == "artisan":
                return {
                    "success": True,
                    "artisan_id": user.get("uid"),
                    "name": user.get("name"),
                    "email": user.get("email"),
                    "profileCompleted": False
                }
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "code": "ARTISAN_NOT_FOUND", "message": f"Artisan '{target_id}' not found."}
            )

        return ArtisanResponse(**art)


@router.post("/profile", summary="Setup or Complete Artisan Profile")
@router.put("/profile", summary="Update Artisan Profile")
def save_artisan_profile(
    profile_in: ArtisanProfileSetupRequest,
    authorization: Optional[str] = Header(None)
):
    with _LOCK:
        user = _get_auth_user(authorization)
        art_id = profile_in.artisan_id or (user.get("uid") if user else None)
        
        if not art_id:
            # Fallback to email lookup or auto-id
            if profile_in.email:
                user_match = next((u for u in USERS.values() if u.get("email") == profile_in.email.lower().strip()), None)
                if user_match:
                    art_id = user_match.get("uid")
            if not art_id:
                art_id = f"CRF-ART-{len(ARTISANS) + 1:06d}"

        craft_val = profile_in.craft or profile_in.craft_category or "Traditional Craft"
        exp_val = profile_in.years_of_experience or profile_in.experience or 5

        # Validate mandatory fields for complete profile
        if not profile_in.name or not craft_val or not profile_in.state:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "code": "VALIDATION_ERROR", "message": "Name, craft, and state are mandatory."}
            )

        now_str = datetime.now().strftime("%d %b %Y")
        existing = ARTISANS.get(art_id, {})

        location_str = profile_in.village or profile_in.district or profile_in.state
        if profile_in.state and profile_in.state not in location_str:
            location_str = f"{location_str}, {profile_in.state}"

        updated_artisan = {
            "artisan_id": art_id,
            "name": profile_in.name,
            "craft": craft_val,
            "craft_type": craft_val,
            "location": location_str,
            "state": profile_in.state,
            "district": profile_in.district or "",
            "village": profile_in.village or "",
            "email": profile_in.email or existing.get("email") or (user.get("email") if user else ""),
            "phone": profile_in.phone or existing.get("phone") or "",
            "bio": profile_in.bio or f"Master artisan specializing in authentic {craft_val}.",
            "craft_story": existing.get("craft_story", f"Traditional craftsmanship rooted in {profile_in.state} heritage."),
            "years_experience": exp_val,
            "skills": profile_in.skills or [craft_val, "Handcrafting"],
            "languages": existing.get("languages", ["en", "hi"]),
            "photo_url": profile_in.photo_url or existing.get("photo_url", "assets/artisan_ramesh.png"),
            "verification_status": existing.get("verification_status", VerificationStatus.PENDING.value),
            "created_at": existing.get("created_at", now_str),
            "profileCompleted": True,
            "productCount": existing.get("productCount", 0),
            "passportCount": existing.get("passportCount", 0)
        }

        ARTISANS[art_id] = updated_artisan

        # Update in USERS collection if linked
        if user:
            user["profileCompleted"] = True
            user["name"] = profile_in.name
            user["updated_at"] = now_str
        elif profile_in.email:
            user_match = next((u for u in USERS.values() if u.get("email") == profile_in.email.lower().strip()), None)
            if user_match:
                user_match["profileCompleted"] = True
                user_match["name"] = profile_in.name

        save_storage()

        return {
            "success": True,
            "code": "PROFILE_COMPLETED",
            "message": "Artisan profile completed successfully. Dashboard unlocked.",
            "artisan": ArtisanResponse(**updated_artisan),
            "profileCompleted": True
        }


@router.post("", response_model=ArtisanResponse, status_code=status.HTTP_201_CREATED, summary="Create New Artisan")
def create_artisan(artisan_in: ArtisanCreate):
    with _LOCK:
        artisan_id = artisan_in.artisan_id
        if not artisan_id:
            seq = len(ARTISANS) + 1
            artisan_id = f"CRF-ART-{seq:06d}"

        if artisan_id in ARTISANS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Artisan with ID '{artisan_id}' already exists."
            )

        now_str = datetime.now().strftime("%d %b %Y")
        artisan_dict = artisan_in.model_dump()
        artisan_dict["artisan_id"] = artisan_id
        artisan_dict["verification_status"] = VerificationStatus.PENDING.value
        artisan_dict["created_at"] = now_str
        artisan_dict["productCount"] = 0
        artisan_dict["passportCount"] = 0

        ARTISANS[artisan_id] = artisan_dict
        save_storage()
        return ArtisanResponse(**artisan_dict)


@router.get("", response_model=List[ArtisanResponse], summary="List All Artisans")
def list_artisans(
    status_filter: Optional[VerificationStatus] = None,
    craft: Optional[str] = None
):
    with _LOCK:
        results = []
        for art in ARTISANS.values():
            if status_filter and art.get("verification_status") != status_filter.value:
                continue
            if craft and craft.lower() not in art.get("craft", "").lower():
                continue
            p_count = sum(1 for p in PRODUCTS.values() if p.get("artisan_id") == art["artisan_id"])
            art["productCount"] = p_count
            results.append(ArtisanResponse(**art))
        return results


@router.get("/{artisan_id}", response_model=ArtisanResponse, summary="Get Artisan Details")
def get_artisan(artisan_id: str):
    with _LOCK:
        art = ARTISANS.get(artisan_id)
        if not art:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Artisan '{artisan_id}' not found.")
        p_count = sum(1 for p in PRODUCTS.values() if p.get("artisan_id") == artisan_id)
        art["productCount"] = p_count
        return ArtisanResponse(**art)


@router.put("/{artisan_id}", response_model=ArtisanResponse, summary="Update Artisan Profile")
def update_artisan(artisan_id: str, artisan_in: ArtisanUpdate):
    with _LOCK:
        art = ARTISANS.get(artisan_id)
        if not art:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Artisan '{artisan_id}' not found.")
        
        updates = artisan_in.model_dump(exclude_unset=True)
        for key, val in updates.items():
            if val is not None:
                if key == "verification_status" and isinstance(val, VerificationStatus):
                    art[key] = val.value
                else:
                    art[key] = val
        
        save_storage()
        return ArtisanResponse(**art)


@router.delete("/{artisan_id}", status_code=status.HTTP_200_OK, summary="Delete Artisan")
def delete_artisan(artisan_id: str):
    with _LOCK:
        if artisan_id not in ARTISANS:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Artisan '{artisan_id}' not found.")
        del ARTISANS[artisan_id]
        save_storage()
        return {"success": True, "message": f"Artisan '{artisan_id}' deleted successfully."}


@router.get("/{artisan_id}/dashboard", response_model=ArtisanDashboardStats, summary="Artisan Dashboard Overview (Profile-Gated)")
def get_artisan_dashboard(
    artisan_id: str,
    authorization: Optional[str] = Header(None)
):
    with _LOCK:
        # Check authentication if provided
        user = _get_auth_user(authorization)
        if user and user.get("role") != "artisan" and user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"success": False, "code": "FORBIDDEN", "message": "Only artisans can access this dashboard."}
            )

        art = ARTISANS.get(artisan_id)
        
        # Check if artisan exists
        if not art:
            # Check if user exists in USERS but has not completed profile
            if user and user.get("uid") == artisan_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "success": False,
                        "code": "PROFILE_INCOMPLETE",
                        "message": "Please complete your artisan profile before accessing the dashboard."
                    }
                )
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Artisan '{artisan_id}' not found.")

        # STRICT BACKEND GATE: profileCompleted must be True
        # Demo seeds (CRF-ART-001284, etc.) are pre-completed; new artisans must complete profile
        is_completed = art.get("profileCompleted", True if artisan_id.startswith("CRF-ART-00128") else False)
        if not is_completed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "code": "PROFILE_INCOMPLETE",
                    "message": "Please complete your artisan profile before accessing the dashboard."
                }
            )

        artisan_products = [p for p in PRODUCTS.values() if p.get("artisan_id") == artisan_id]
        total_products = len(artisan_products)
        verified_products = sum(1 for p in artisan_products if p.get("status") in ["VERIFIED", "verified"])
        pending_products = sum(1 for p in artisan_products if p.get("status") in ["PENDING_VERIFICATION", "pending", "DRAFT"])
        
        total_val = sum(float(p.get("price", 0)) for p in artisan_products)

        artisan_inquiries = [i for i in INQUIRIES.values() if i.get("artisan_id") == artisan_id]
        total_inquiries = len(artisan_inquiries)
        pending_inquiries = sum(1 for i in artisan_inquiries if i.get("status") == "PENDING")

        buyer_matches_count = sum(len(p.get("buyer_matches", [])) for p in artisan_products)

        return ArtisanDashboardStats(
            artisan_id=artisan_id,
            artisan_name=art.get("name", "Artisan"),
            total_products=total_products,
            verified_products=verified_products,
            pending_products=pending_products,
            total_inquiries=total_inquiries,
            pending_inquiries=pending_inquiries,
            buyer_matches=buyer_matches_count,
            estimated_total_product_value=round(total_val, 2),
            profileCompleted=True
        )
