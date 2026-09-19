from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from .common import VerificationStatus

class ArtisanBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Artisan's full name")
    craft: str = Field(..., min_length=2, max_length=100, description="Main craft category")
    craft_type: Optional[str] = Field(None, description="Specific technique or sub-category")
    location: str = Field(..., min_length=2, max_length=100, description="City / Village / District")
    state: Optional[str] = Field("Assam", description="State in India")
    district: Optional[str] = Field(None, description="District")
    village: Optional[str] = Field(None, description="Village or local area")
    email: Optional[str] = Field(None, description="Artisan registered email")
    phone: Optional[str] = Field(None, description="Contact phone number")
    bio: Optional[str] = Field(None, description="Short biography of the artisan")
    craft_story: Optional[str] = Field(None, description="Heritage story and technique background")
    years_experience: int = Field(5, ge=0, le=80, description="Years of craft experience")
    skills: List[str] = Field(default_factory=list, description="Artisan craft skills")
    languages: List[str] = Field(default_factory=lambda: ["en", "hi"], description="Spoken languages")
    photo_url: Optional[str] = Field("assets/artisan_ramesh.png", description="Photo URL")
    profileCompleted: bool = Field(False, description="Whether artisan has completed registration setup")

class ArtisanCreate(ArtisanBase):
    artisan_id: Optional[str] = Field(None, description="Optional custom ID. Auto-generated if not provided.")

class ArtisanUpdate(BaseModel):
    name: Optional[str] = None
    craft: Optional[str] = None
    craft_type: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    craft_story: Optional[str] = None
    years_experience: Optional[int] = None
    skills: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    verification_status: Optional[VerificationStatus] = None
    photo_url: Optional[str] = None
    profileCompleted: Optional[bool] = None

class ArtisanProfileSetupRequest(BaseModel):
    artisan_id: Optional[str] = None
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    state: str
    district: Optional[str] = None
    village: Optional[str] = None
    craft: Optional[str] = None
    craft_category: Optional[str] = None
    experience: Optional[int] = 5
    years_of_experience: Optional[int] = 5
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    photo_url: Optional[str] = None

class ArtisanResponse(ArtisanBase):
    artisan_id: str
    verification_status: VerificationStatus = VerificationStatus.PENDING
    created_at: str
    profileCompleted: bool = False

    # Frontend compatibility helper aliases
    id: Optional[str] = None
    craftCategory: Optional[str] = None
    isVerified: Optional[bool] = None
    photoUrl: Optional[str] = None
    productCount: int = 0
    passportCount: int = 0

    def model_post_init(self, __context):
        if not self.id:
            self.id = self.artisan_id
        if not self.craftCategory:
            self.craftCategory = self.craft
        if self.isVerified is None:
            self.isVerified = (self.verification_status == VerificationStatus.VERIFIED)
        if not self.photoUrl:
            self.photoUrl = self.photo_url

class ArtisanDashboardStats(BaseModel):
    artisan_id: str
    artisan_name: str
    total_products: int
    verified_products: int
    pending_products: int
    total_inquiries: int
    pending_inquiries: int
    buyer_matches: int
    estimated_total_product_value: float
    profileCompleted: bool = True
