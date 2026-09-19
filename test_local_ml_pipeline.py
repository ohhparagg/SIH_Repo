"""
Comprehensive Test Script for CRAFTORA Local AI/ML Pipeline.
Tests:
1. Validator (Stage 1) - format, size, blurriness, exposure
2. Enhancer (Stage 2) - CLAHE, white balance, detail sharpening
3. Detector (Stage 3) - Saliency mask, centering, bounding box
4. Classifier (Stage 4) - 8 Indian handicraft categories with calibrated confidence
5. Attributes (Stage 5) - K-Means color palette, authentic materials
6. Authenticity (Stage 6) - Handmade craft indicator scoring & transparency
7. Pricing (Stage 7) - ML RandomForestRegressor model integration
8. Catalog & DPP (Stage 8) - Bilingual story generation & SHA-256 digital passport
9. Full Pipeline (Stage 9) - End-to-end execution across multiple craft assets
10. FastAPI AI Router - Endpoint responses via direct client
"""

import sys
import os
import json
import base64
from pathlib import Path

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath("."))

from backend.ml.pipeline import (
    validate_image,
    enhance_craft_image,
    detect_craft_object,
    classify_craft,
    extract_attributes,
    compute_handmade_indicators,
    generate_catalog_story,
    CraftoraMLPipeline
)
from backend.services.pricing_service import PricingService
from backend.main import app

def run_tests():
    passed = 0
    total = 0

    def check(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  \033[92m[PASS]\033[0m {name}")
        else:
            print(f"  \033[91m[FAIL]\033[0m {name}: {details}")

    print("==================================================")
    print("CRAFTORA LOCAL AI/ML PIPELINE COMPREHENSIVE TESTS")
    print("==================================================")

    # 1. Validation Tests
    print("\n--- 1. Image Validation (Stage 1) ---")
    basket_path = "assets/bamboo_basket.png"
    with open(basket_path, "rb") as f:
        basket_bytes = f.read()

    val_res = validate_image(basket_bytes, filename="bamboo_basket.png")
    check("Validate Real Image", val_res["is_valid"] is True)
    check("Extract Dimensions", val_res["width"] > 0 and val_res["height"] > 0)
    check("Compute Blur Score", "blur_score" in val_res and val_res["blur_score"] > 0)
    check("Compute Brightness", "mean_brightness" in val_res)

    empty_val = validate_image(b"")
    check("Reject Empty File", empty_val["is_valid"] is False and empty_val["error_code"] == "EMPTY_FILE")

    corrupt_val = validate_image(b"not_an_image_data_here")
    check("Reject Corrupted File", corrupt_val["is_valid"] is False and corrupt_val["error_code"] == "CORRUPT_IMAGE")

    # 2. Enhancement Tests
    print("\n--- 2. Image Enhancement (Stage 2) ---")
    enh_res = enhance_craft_image(basket_bytes, filename_hint="bamboo_basket.png")
    check("Enhancement Succeeded", enh_res["enhancement_status"] == "success")
    check("Generates Base64 Data URL", enh_res["data_url"].startswith("data:image/jpeg;base64,"))
    check("Applies Multi-Stage Filters", len(enh_res["filters_applied"]) >= 3)
    check("Saves Enhanced Image File", os.path.exists(enh_res["enhanced_file_path"]))

    # 3. Object Detection Tests
    print("\n--- 3. Object Detection & Localization (Stage 3) ---")
    det_res = detect_craft_object(basket_bytes)
    bbox = det_res["bounding_box"]
    check("Detection Status OK", det_res["status"] == "detected")
    check("Bounding Box Normalized", 0.0 <= bbox["ymin"] < bbox["ymax"] <= 1.0 and 0.0 <= bbox["xmin"] < bbox["xmax"] <= 1.0)
    check("Coverage Ratio Positive", det_res["coverage_ratio"] > 0.05)
    check("Confidence Calibrated", 0.40 <= det_res["confidence"] <= 1.0)
    check("Crop Data URL Generated", det_res["crop_data_url"].startswith("data:image/jpeg;base64,"))

    # 4. Craft Classification Tests
    print("\n--- 4. Craft Recognition & Classification (Stage 4) ---")
    clf_res = classify_craft(basket_bytes, hint_filename="bamboo_basket.png")
    check("Classify Bamboo Basket", clf_res["primary_category"] == "Bamboo Craft")
    check("Returns Technique Profile", len(clf_res["craft_type"]) > 5)
    check("Provides Top-3 Probabilities", len(clf_res["top_predictions"]) == 3)
    check("Includes GI Tag Reference", "gi_tag_reference" in clf_res)

    # Test with other assets
    cup_path = "assets/ceramic_cup.png"
    if os.path.exists(cup_path):
        with open(cup_path, "rb") as f:
            cup_bytes = f.read()
        clf_cup = classify_craft(cup_bytes, hint_filename="ceramic_cup.png")
        check("Classify Ceramic Cup", clf_cup["primary_category"] == "Blue Pottery")

    art_path = "assets/madhubani_art.png"
    if os.path.exists(art_path):
        with open(art_path, "rb") as f:
            art_bytes = f.read()
        clf_art = classify_craft(art_bytes, hint_filename="madhubani_art.png")
        check("Classify Madhubani Painting", clf_art["primary_category"] == "Madhubani Painting")

    # 5. Attributes & Palette Tests
    print("\n--- 5. Attribute & Palette Extraction (Stage 5) ---")
    attr_res = extract_attributes(basket_bytes, category="Bamboo Craft")
    palette = attr_res["dominant_palette"]
    check("Extract 4-Color Palette", len(palette) == 4)
    check("Palette Contains Hex Codes", all(c["hex"].startswith("#") for c in palette))
    check("Palette Contains Artisanal Names", all(len(c["name"]) > 2 for c in palette))
    check("Extract Texture Characteristics", len(attr_res["texture_characteristics"]) >= 2)

    # 6. Handmade Craft Indicators Tests
    print("\n--- 6. Handmade Indicator Scoring (Stage 6) ---")
    hand_res = compute_handmade_indicators(basket_bytes, category="Bamboo Craft")
    check("Handmade Score in Valid Range", 0.50 <= hand_res["handmade_indicator_score"] <= 1.0)
    check("Positive Indicators List", len(hand_res["positive_indicators"]) >= 2)
    check("Transparency Statement Present", "photographic AI cannot replace physical provenance" in hand_res["transparency_statement"])
    check("Scientific Integrity Enforced", hand_res["is_ai_indicator"] is True)

    # 7. Pricing Model Tests
    print("\n--- 7. Smart Pricing Engine Integration (Stage 7) ---")
    pricing = PricingService.calculate_pricing(
        material_cost=300.0,
        labour_cost=450.0,
        production_days=3,
        category="Bamboo Craft",
        region="Assam",
        market_demand="medium"
    )
    check("Pricing Returns Recommended Price", pricing["recommended_price"] > 750.0)
    check("Pricing Has Min-Max Range", pricing["suggested_min_price"] < pricing["recommended_price"] < pricing["suggested_max_price"])
    check("Estimated Profit Calculated", pricing["estimated_profit"] > 0)
    check("Pricing Identifies Model", "model_used" in pricing)

    # 8. Heritage Storytelling & DPP Tests
    print("\n--- 8. Heritage Story & Digital Product Passport (Stage 8) ---")
    cat_res = generate_catalog_story(
        category="Bamboo Craft",
        materials=["Natural Bamboo", "Cane Binding"],
        region="Assam"
    )
    dpp = cat_res["digital_product_passport"]
    check("English Title Generated", len(cat_res["product_name_en"]) > 5)
    check("Hindi Title Generated", len(cat_res["product_name_hi"]) > 5)
    check("Story Narrative Formatted", len(cat_res["description"]) > 50)
    check("Care Instructions Formatted", len(cat_res["care_instructions"]) > 10)
    check("SEO Tags Provided", len(cat_res["tags"]) >= 5)
    check("DPP Cryptographic Hash Generated", dpp["provenance_hash"].startswith("0x") and len(dpp["provenance_hash"]) == 66)

    # 9. Master Orchestrator End-to-End Tests
    print("\n--- 9. Full Master Pipeline (All 8 Stages) ---")
    pipeline_res = CraftoraMLPipeline.run_full_pipeline(
        image_input=basket_bytes,
        filename="bamboo_basket.png",
        language="EN"
    )
    check("Pipeline Status Success", pipeline_res["analysisStatus"] == "success")
    check("Fast Execution Latency", pipeline_res["pipeline_latency_ms"] < 1500)
    check("Product Title Formatted", pipeline_res["product_name"] == "Handwoven Artisanal Bamboo & Cane Craft")
    check("Category Matched", pipeline_res["category"] == "Bamboo Craft")
    check("Price Calculated via ML", pipeline_res["suggested_price"] > 500)
    check("All 8 Modular Stages Present", len(pipeline_res["stages"]) >= 7)
    check("Enhanced Image URL Returned", pipeline_res["enhanced_image_url"].startswith("assets/enhanced/"))
    check("Enhanced Data URL Returned", pipeline_res["enhancedImageUrl"].startswith("data:image/jpeg;base64,"))

    # Test Hindi language support
    hi_res = CraftoraMLPipeline.run_full_pipeline(
        image_input=basket_bytes,
        filename="bamboo_basket.png",
        language="HI"
    )
    check("Hindi Title Generated in HI Mode", "बाँस" in hi_res["product_name"])

    # 10. Direct Base64 String Input
    print("\n--- 10. Base64 & Data URL Input Support ---")
    b64_str = f"data:image/png;base64,{base64.b64encode(basket_bytes).decode('ascii')}"
    b64_res = CraftoraMLPipeline.run_full_pipeline(
        image_input=b64_str,
        filename="bamboo_basket.png"
    )
    check("Decode Data URL and Analyze", b64_res["analysisStatus"] == "success")

    print("\n==================================================")
    print(f"RESULTS: {passed}/{total} tests passed ({round((passed/total)*100, 1)}%)")
    print("==================================================")

    if passed == total:
        print("\033[92mALL CRAFTORA LOCAL ML PIPELINE TESTS PASSED PERFECTLY!\033[0m")
        return 0
    else:
        print(f"\033[91m{total - passed} tests failed.\033[0m")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
