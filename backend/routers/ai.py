from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Body, status, HTTPException
from pydantic import BaseModel
from ..services.ai_service import AIService
from ..data.demo_data import ARTISANS, _LOCK

router = APIRouter(prefix="/api/ai", tags=["AI Cataloguing & Voice"])

class VoiceToProductRequest(BaseModel):
    transcript: str
    language: str = "EN"
    artisan_id: Optional[str] = None


class AnalyzeProductRequest(BaseModel):
    image: Optional[str] = None
    filename: Optional[str] = None
    artisan_id: Optional[str] = None
    artisanId: Optional[str] = None
    language: Optional[str] = "EN"


class EnhanceImageRequest(BaseModel):
    image: Optional[str] = None
    filename: Optional[str] = "craft.png"


@router.get("/status", summary="AI ML Pipeline Health & Status")
async def ai_status():
    """Returns local AI/ML pipeline availability and loaded capabilities."""
    return {
        "status": "online",
        "engine": "CRAFTORA Local ML Neural & Heuristic Pipeline v2.0",
        "offline_ready": True,
        "external_api_required": False,
        "stages": [
            "Stage 1: Image Validation (Laplacian blur, exposure, resolution)",
            "Stage 2: Image Enhancement (Adaptive CLAHE, white balance, unsharp mask)",
            "Stage 3: Object Detection (Saliency mask, centering, bounding box)",
            "Stage 4: Craft Classification (8 Indian heritage categories)",
            "Stage 5: Attribute Extraction (K-Means 4-color palette, materials)",
            "Stage 6: Handmade Craft Indicators (Observable micro-weave & contour scoring)",
            "Stage 7: Smart ML Pricing (RandomForestRegressor model)",
            "Stage 8: Cultural Storytelling & Digital Product Passport (SHA-256)"
        ]
    }


@router.post("/analyze-product", summary="AI Product Cataloguing (Vision Analysis)")
async def analyze_product(
    payload: Optional[AnalyzeProductRequest] = Body(None),
    image: Optional[UploadFile] = File(None),
    artisan_id: Optional[str] = Form(None),
    language: Optional[str] = Form("EN")
):
    """
    Analyzes uploaded product photograph and generates draft catalogue attributes.
    Supports JSON body with base64 data URL, multipart file upload, or asset filename.
    """
    img_bytes = None
    img_url = None
    filename = "bamboo_basket.png"
    art_id = artisan_id
    lang = language or "EN"

    if payload:
        if payload.image:
            img_url = payload.image
        if payload.filename:
            filename = payload.filename
        if payload.artisan_id or payload.artisanId:
            art_id = payload.artisan_id or payload.artisanId
        if payload.language:
            lang = payload.language
    elif image:
        filename = image.filename or "upload.jpg"
        img_bytes = await image.read()

    artisan_craft = None
    if art_id:
        with _LOCK:
            art = ARTISANS.get(art_id)
            if art:
                artisan_craft = art.get("craft")

    analysis = AIService.analyze_product_image(
        filename=filename,
        artisan_id=art_id,
        artisan_craft=artisan_craft,
        language=lang,
        image_url=img_url,
        image_bytes=img_bytes
    )
    if not analysis.get("success", True) or analysis.get("code") == "NO_PRODUCT_DETECTED":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=analysis
        )
    return analysis

@router.post("/voice-to-product", summary="Voice Assistant Transcription to Product Fields")
async def voice_to_product(
    payload: Optional[VoiceToProductRequest] = Body(None),
    transcript: Optional[str] = Form(None),
    language: Optional[str] = Form("EN"),
    artisan_id: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None)
):
    """
    Accepts spoken audio or speech-to-text transcript (Hindi / English)
    and extracts structured craft details for the cataloguing wizard.
    """
    # Prefer structured JSON transcript, fallback to form fields
    text = ""
    lang = "EN"
    art_id = None

    if payload:
        text = payload.transcript
        lang = payload.language or "EN"
        art_id = payload.artisan_id
    elif transcript:
        text = transcript
        lang = language or "EN"
        art_id = artisan_id
    elif audio_file:
        # Honest fallback when direct audio binary is sent without an external STT key
        return {
            "ai_generated": True,
            "ai_mode": "demo",
            "message": "Audio received. Web Speech API transcript processing recommended for browser voice input.",
            "product_name": "Handcrafted Artisanal Product",
            "category": "Handicrafts",
            "craft_type": "Traditional Craft",
            "description": "Handcrafted artisanal product described via voice input.",
            "materials": ["Natural Materials"],
            "production_time": "2-3 Days",
            "location": "India",
            "confidence": None,
            "disclaimer": "AI Generated / Demo AI. Audio model simulated."
        }

    return AIService.voice_to_product(transcript=text, language=lang, artisan_id=art_id)

@router.post("/enhance-image", summary="AI Product Image Lighting Enhancement")
async def enhance_image(
    payload: Optional[EnhanceImageRequest] = Body(None),
    image: Optional[UploadFile] = File(None)
):
    """
    Performs craft photo contrast and lighting enhancement using local computer vision (CLAHE & unsharp masking).
    """
    img_bytes = None
    img_url = None
    filename = "craft.png"

    if payload:
        img_url = payload.image
        if payload.filename:
            filename = payload.filename
    elif image:
        filename = image.filename or "craft.png"
        img_bytes = await image.read()

    return AIService.enhance_image(
        image_bytes=img_bytes,
        filename=filename,
        image_url=img_url
    )
