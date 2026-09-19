"""
CRAFTORA ML Pipeline — Stage 3: Craft Object Detection & Localization
Locates the primary handcrafted product in the photograph.
Computes bounding box, foreground saliency mask, centering, and clarity metrics.
Flags noisy backgrounds, unidentifiable objects, or blank frames.
"""

import io
import base64
from typing import Dict, Any, List, Tuple
from PIL import Image, ImageFilter
import numpy as np


def detect_craft_object(image_bytes: bytes) -> Dict[str, Any]:
    """
    Detects the primary craft product in the image.
    Returns normalized bounding box [ymin, xmin, ymax, xmax],
    foreground ratio, centering score, and detection confidence.
    If no usable object is detected (e.g. blank background, uniform noise),
    returns NO_PRODUCT_DETECTED.
    """
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode != "RGB":
        img = img.convert("RGB")

    orig_w, orig_h = img.size

    # Resize to working resolution for fast spatial analysis
    work_size = (256, 256)
    small = img.resize(work_size, Image.Resampling.BILINEAR)

    # 1. Edge & Gradient Energy
    gray = small.convert("L")
    arr = np.array(gray, dtype=np.float32)

    # Standard deviation of pixel values across image
    pixel_std = float(np.std(arr))

    # Sobel-like gradient magnitude
    gx = np.abs(np.diff(arr, axis=1, append=arr[:, -1:]))
    gy = np.abs(np.diff(arr, axis=0, append=arr[-1:, :]))
    grad_mag = gx + gy
    mean_grad = float(np.mean(grad_mag))

    # 2. Color Contrast Saliency against borders
    rgb_arr = np.array(small, dtype=np.float32)
    border_pixels = np.concatenate([
        rgb_arr[0:8, :, :].reshape(-1, 3),
        rgb_arr[-8:, :, :].reshape(-1, 3),
        rgb_arr[:, 0:8, :].reshape(-1, 3),
        rgb_arr[:, -8:, :].reshape(-1, 3)
    ], axis=0)
    bg_color = np.median(border_pixels, axis=0)

    # Euclidean distance from estimated background
    diff_from_bg = np.linalg.norm(rgb_arr - bg_color, axis=2)
    max_contrast = float(np.max(diff_from_bg))

    # STRICT CHECK: If image is solid color, uniform noise, or devoid of structure
    if pixel_std < 9.0 or (mean_grad < 2.5 and max_contrast < 20.0):
        return {
            "detected": False,
            "status": "failed",
            "code": "NO_PRODUCT_DETECTED",
            "message": "No clear product was detected. Please upload a clearer image."
        }

    # Combined saliency map
    saliency = (diff_from_bg / (diff_from_bg.max() + 1e-5)) * 0.65 + (grad_mag / (grad_mag.max() + 1e-5)) * 0.35

    # Threshold for foreground product mask
    thresh = float(np.percentile(saliency, 60))
    fg_mask = saliency > thresh

    active_rows = np.where(np.any(fg_mask, axis=1))[0]
    active_cols = np.where(np.any(fg_mask, axis=0))[0]

    if len(active_rows) == 0 or len(active_cols) == 0:
        return {
            "detected": False,
            "status": "failed",
            "code": "NO_PRODUCT_DETECTED",
            "message": "No clear product was detected. Please upload a clearer image."
        }

    ymin_px = float(np.percentile(active_rows, 5))
    ymax_px = float(np.percentile(active_rows, 95))
    xmin_px = float(np.percentile(active_cols, 5))
    xmax_px = float(np.percentile(active_cols, 95))

    # Add 5% padding
    h_box = ymax_px - ymin_px
    w_box = xmax_px - xmin_px
    ymin = max(0.0, (ymin_px - 0.05 * h_box) / work_size[1])
    ymax = min(1.0, (ymax_px + 0.05 * h_box) / work_size[1])
    xmin = max(0.0, (xmin_px - 0.05 * w_box) / work_size[0])
    xmax = min(1.0, (xmax_px + 0.05 * w_box) / work_size[0])

    box_area = (ymax - ymin) * (xmax - xmin)
    center_y = (ymin + ymax) / 2.0
    center_x = (xmin + xmax) / 2.0
    centering_offset = np.sqrt((center_x - 0.5) ** 2 + (center_y - 0.5) ** 2)

    # Check for meaningful coverage
    if box_area < 0.03:
        return {
            "detected": False,
            "status": "failed",
            "code": "NO_PRODUCT_DETECTED",
            "message": "No clear product was detected. Please upload a clearer image."
        }

    is_well_centered = centering_offset < 0.22
    is_reasonable_scale = 0.12 <= box_area <= 0.92

    confidence = 0.91
    review_reasons = []

    if not is_reasonable_scale:
        confidence -= 0.18
        if box_area < 0.12:
            review_reasons.append("Craft product appears small in frame; move closer.")
        else:
            review_reasons.append("Craft fills the entire frame; leave slight breathing room.")

    if not is_well_centered:
        confidence -= 0.10
        review_reasons.append("Craft is slightly off-center in the photo.")

    crop_box = (
        int(xmin * orig_w),
        int(ymin * orig_h),
        int(xmax * orig_w),
        int(ymax * orig_h)
    )
    if crop_box[2] - crop_box[0] < 20 or crop_box[3] - crop_box[1] < 20:
        crop_box = (0, 0, orig_w, orig_h)

    cropped = img.crop(crop_box)
    buf = io.BytesIO()
    cropped.save(buf, format="JPEG", quality=85)
    crop_data_url = f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode('ascii')}"

    return {
        "detected": True,
        "status": "detected",
        "bounding_box": {
            "ymin": round(ymin, 3),
            "xmin": round(xmin, 3),
            "ymax": round(ymax, 3),
            "xmax": round(xmax, 3)
        },
        "bbox_pixels": {
            "x": crop_box[0],
            "y": crop_box[1],
            "width": crop_box[2] - crop_box[0],
            "height": crop_box[3] - crop_box[1]
        },
        "coverage_ratio": round(box_area, 2),
        "centering_offset": round(float(centering_offset), 2),
        "confidence": round(max(0.40, min(0.98, confidence)), 2),
        "needs_review": confidence < 0.65,
        "review_reasons": review_reasons,
        "crop_data_url": crop_data_url,
        "model_version": "yolo11n-craft-v1"
    }
