"""
CRAFTORA ML Pipeline — Stage 1: Image Validation
Validates craft product photographs for format, resolution, blurriness, and exposure.
Provides actionable feedback for artisans to capture high-catalogue-quality photos.
"""

import io
from typing import Dict, Any, List
from PIL import Image, ImageStat
import numpy as np

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
MIN_RESOLUTION = (160, 160)
MAX_RESOLUTION = (6000, 6000)
BLUR_THRESHOLD = 50.0  # Laplacian variance threshold


def validate_image(image_bytes: bytes, filename: str = "upload.jpg") -> Dict[str, Any]:
    """
    Validates uploaded image byte stream.
    Returns dictionary with validation status, quality metrics, and artisan tips.
    """
    issues: List[str] = []
    tips: List[str] = []

    # 1. Size check
    file_size = len(image_bytes)
    if file_size == 0:
        return {
            "is_valid": False,
            "error_code": "EMPTY_FILE",
            "message": "The uploaded file is empty. Please choose a valid craft photo.",
            "issues": ["Zero-byte file provided"],
            "tips": ["Select a photo from your gallery or take a new one."]
        }

    if file_size > MAX_FILE_SIZE_BYTES:
        issues.append(f"File size ({file_size // (1024 * 1024)}MB) exceeds maximum limit of 15MB.")
        tips.append("Try capturing the image with standard camera resolution instead of ultra-RAW.")

    # 2. Format & Integrity check
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()
        # Re-open because verify() closes the stream / corrupts state for further operations
        img = Image.open(io.BytesIO(image_bytes))
        img_format = (img.format or "JPEG").upper()
    except Exception as exc:
        return {
            "is_valid": False,
            "error_code": "CORRUPT_IMAGE",
            "message": f"Could not decode image format: {exc}",
            "issues": ["Corrupted or unsupported image file"],
            "tips": ["Ensure the file is a standard JPEG, PNG, or WebP photo."]
        }

    allowed_formats = {"JPEG", "JPG", "PNG", "WEBP", "BMP"}
    if img_format not in allowed_formats:
        issues.append(f"Format '{img_format}' is not standard for web cataloguing.")
        tips.append("Convert to JPG or PNG for optimal catalogue display.")

    width, height = img.size

    # 3. Resolution check
    if width < MIN_RESOLUTION[0] or height < MIN_RESOLUTION[1]:
        issues.append(f"Resolution ({width}x{height}) is too low for clear craft detail inspection.")
        tips.append("Move closer to the craft or use higher camera resolution (at least 300x300).")

    # 4. Exposure and Lighting Analysis
    if img.mode != "RGB":
        rgb_img = img.convert("RGB")
    else:
        rgb_img = img

    stat = ImageStat.Stat(rgb_img)
    mean_brightness = sum(stat.mean[:3]) / 3.0  # 0 to 255

    is_underexposed = mean_brightness < 35.0
    is_overexposed = mean_brightness > 225.0

    if is_underexposed:
        issues.append("Photo is very dark/underexposed.")
        tips.append("Place the craft in good natural lighting or near a window.")
    elif is_overexposed:
        issues.append("Photo is washed out/overexposed.")
        tips.append("Avoid harsh direct camera flash; diffuse the light source.")

    # 5. Blur Detection (Laplacian Variance on Grayscale)
    gray = rgb_img.convert("L")
    gray_arr = np.array(gray, dtype=np.float32)

    # Compute 3x3 Laplacian via 2D convolution with numpy
    padded = np.pad(gray_arr, 1, mode='reflect')
    laplacian = (
        padded[:-2, 1:-1] +
        padded[2:, 1:-1] +
        padded[1:-1, :-2] +
        padded[1:-1, 2:] -
        4.0 * padded[1:-1, 1:-1]
    )
    blur_score = float(np.var(laplacian))

    is_blurry = blur_score < BLUR_THRESHOLD
    if is_blurry:
        issues.append("Photo appears slightly blurry or out of focus.")
        tips.append("Hold your phone steady or tap on the craft item to lock focus.")

    # Determine overall validity
    is_valid = (file_size <= MAX_FILE_SIZE_BYTES) and (width >= 100 and height >= 100)

    quality_rating = "Excellent"
    if blur_score < 40 or is_underexposed or is_overexposed:
        quality_rating = "Fair (Auto-enhancement recommended)"
    elif blur_score < 80:
        quality_rating = "Good"

    return {
        "is_valid": is_valid,
        "filename": filename,
        "format": img_format,
        "width": width,
        "height": height,
        "aspect_ratio": round(width / max(1, height), 2),
        "file_size_kb": round(file_size / 1024, 1),
        "mean_brightness": round(mean_brightness, 1),
        "blur_score": round(blur_score, 1),
        "quality_rating": quality_rating,
        "is_blurry": is_blurry,
        "is_underexposed": is_underexposed,
        "is_overexposed": is_overexposed,
        "issues": issues,
        "tips": tips
    }
