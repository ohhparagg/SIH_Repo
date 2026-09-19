"""
End-to-End Automated Verification Suite for CRAFTORA Production-Ready Features
Tests all 7 features required by the specification:
1. Real Email OTP Authentication
2. Artisan Registration + Profile Completion Gate
3. Real-Time AI Product Analysis (Blank image rejection vs real craft analysis)
4. Real Smart Pricing via XGBoost
5. Purchase-Based Product Reviews (Backend gate)
6. Product Reviews Display & Duplicate Prevention
7. Collision-Resistant Product IDs & SHA-256 Digital Provenance Passports
"""

import sys
import re
import json
import time
import requests
import io
from PIL import Image

BASE_URL = "http://localhost:8000/api"

def print_test(name):
    print(f"\n{'='*70}\n[TEST] {name}\n{'='*70}")

def assert_true(cond, msg):
    if not cond:
        print(f"❌ FAILED: {msg}")
        raise AssertionError(msg)
    print(f"✅ PASSED: {msg}")

def test_1_email_otp_auth():
    print_test("1. Real Email OTP Authentication")
    test_email = f"artisan_{int(time.time())}@craftora.in"
    
    # 1. Send OTP
    res = requests.post(f"{BASE_URL}/auth/send-otp", json={"email": test_email, "role": "artisan", "purpose": "register"})
    assert_true(res.status_code == 200, f"Send OTP responded 200: {res.text}")
    data = res.json()
    assert_true(data.get("success") is True, "Send OTP success flag is true")
    
    # In test environment, retrieve the generated OTP from dev endpoint
    dev_res = requests.get(f"{BASE_URL}/auth/dev-otp?email={test_email}")
    assert_true(dev_res.status_code == 200, f"Retrieved dev OTP for test: {dev_res.text}")
    otp_code = dev_res.json().get("otp")
    assert_true(bool(otp_code and len(otp_code) == 6), f"Got valid 6-digit generated OTP code: {otp_code}")
    
    # 2. Verify wrong OTP fails
    wrong_res = requests.post(f"{BASE_URL}/auth/verify-otp", json={"email": test_email, "otp": "000000"})
    assert_true(wrong_res.status_code == 200, f"Wrong OTP request processed: HTTP {wrong_res.status_code}")
    wdata = wrong_res.json()
    assert_true(wdata.get("success") is False and wdata.get("code") == "INVALID_OTP", f"Wrong OTP correctly rejected with code INVALID_OTP: {wdata}")
    
    # 3. Verify correct OTP succeeds
    verify_res = requests.post(f"{BASE_URL}/auth/verify-otp", json={"email": test_email, "otp": otp_code})
    assert_true(verify_res.status_code == 200, f"Correct OTP verified: {verify_res.text}")
    vdata = verify_res.json()
    assert_true("token" in vdata, "Token returned upon verification")
    assert_true("user" in vdata, "User object returned upon verification")
    user = vdata["user"]
    assert_true(user.get("email") == test_email, f"User email matches {test_email}")
    assert_true(user.get("profileCompleted") is False, "New user starts with profileCompleted: False")
    
    return vdata["token"], user

def test_2_profile_completion_gate(token, user):
    print_test("2. Artisan Registration + Profile Completion Gate")
    user_id = user["uid"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Access dashboard before completing profile -> Expect HTTP 403 PROFILE_INCOMPLETE
    dash_res = requests.get(f"{BASE_URL}/artisans/{user_id}/dashboard", headers=headers)
    assert_true(dash_res.status_code == 403, f"Incomplete profile blocked from dashboard with HTTP 403: {dash_res.status_code}")
    err_body = dash_res.json()
    err_code = err_body.get("detail", {}).get("code") or err_body.get("code")
    assert_true(err_code == "PROFILE_INCOMPLETE", f"Error code is 'PROFILE_INCOMPLETE' (got: {err_code})")
    
    # 2. Complete Profile with all mandatory fields
    profile_data = {
        "artisan_id": user_id,
        "name": "Devi Ram",
        "email": user["email"],
        "phone": "9876543210",
        "state": "Rajasthan",
        "district": "Jaipur",
        "village": "Sanganer",
        "craft_category": "Blue Pottery",
        "years_of_experience": 14,
        "bio": "Master craftsman specializing in traditional Rajasthani quartz blue pottery.",
        "skills": ["Pottery Throwing", "Natural Glazing", "Traditional Kiln Firing"]
    }
    
    save_res = requests.post(f"{BASE_URL}/artisans/profile", json=profile_data, headers=headers)
    assert_true(save_res.status_code == 200, f"Profile updated successfully: {save_res.text}")
    saved = save_res.json()
    assert_true(saved.get("profileCompleted") is True, "profileCompleted is now True")
    
    # 3. Access dashboard again -> Expect HTTP 200 OK
    dash_ok = requests.get(f"{BASE_URL}/artisans/{user_id}/dashboard", headers=headers)
    assert_true(dash_ok.status_code == 200, f"Dashboard access unlocked after completing profile: {dash_ok.status_code}")

def test_3_ai_product_analysis():
    print_test("3. Real-Time AI Product Analysis Pipeline")
    
    # 1. Blank/Noise Image -> Expect NO_PRODUCT_DETECTED rejection
    blank_img = Image.new("RGB", (300, 300), color=(240, 240, 240))
    buf_blank = io.BytesIO()
    blank_img.save(buf_blank, format="JPEG")
    buf_blank.seek(0)
    
    blank_res = requests.post(
        f"{BASE_URL}/ai/analyze-product",
        files={"image": ("blank.jpg", buf_blank, "image/jpeg")},
        data={"category_hint": "Pottery"}
    )
    assert_true(blank_res.status_code in [400, 422], f"Blank image correctly rejected with HTTP {blank_res.status_code}")
    body = blank_res.json()
    code = body.get("detail", {}).get("code") or body.get("code")
    assert_true(code == "NO_PRODUCT_DETECTED", f"Error code is 'NO_PRODUCT_DETECTED' (got: {code})")
    
    # 2. Genuine Craft Image (Real handicraft from assets)
    craft_path = "assets/bamboo_basket.png"
    with open(craft_path, "rb") as f:
        craft_bytes = f.read()
    
    craft_res = requests.post(
        f"{BASE_URL}/ai/analyze-product",
        files={"image": ("bamboo_basket.png", craft_bytes, "image/png")},
        data={"category_hint": "Bamboo Craft"}
    )
    assert_true(craft_res.status_code == 200, f"Real craft image analyzed successfully: {craft_res.status_code}")
    ai_data = craft_res.json()
    assert_true("category" in ai_data, "AI returned classified category")
    assert_true("materials" in ai_data and len(ai_data["materials"]) > 0, "AI returned detected materials")
    assert_true("enhancement" in ai_data, "AI returned enhancement metadata")
    print(f"   AI Output: Category='{ai_data.get('category')}', Materials={ai_data.get('materials')}")

def test_4_smart_pricing():
    print_test("4. Real Smart Pricing via Trained XGBoost Regressor")
    payload = {
        "category": "Blue Pottery",
        "materials": ["Quartz Stone", "Natural Cobalt Oxide", "Fuller Earth Clay"],
        "production_time_days": 5,
        "artisan_experience_years": 12,
        "region": "Rajasthan",
        "complexity": "High",
        "item_weight_kg": 1.2
    }
    
    res = requests.post(f"{BASE_URL}/pricing/calculate", json=payload)
    assert_true(res.status_code == 200, f"Pricing calculation responded HTTP 200: {res.text}")
    pricing = res.json()
    
    assert_true(pricing.get("model_version") == "xgboost-v1", f"Model version is 'xgboost-v1' (got: {pricing.get('model_version')})")
    assert_true(isinstance(pricing.get("recommended_price"), (int, float)) and pricing["recommended_price"] > 0, f"Recommended price is positive number: ₹{pricing.get('recommended_price')}")
    assert_true("price_range" in pricing, "Price range object present")
    pr = pricing["price_range"]
    assert_true(pr["min_price"] < pr["max_price"], f"Price range valid: ₹{pr['min_price']} - ₹{pr['max_price']}")
    assert_true("confidence_score" in pricing, f"Confidence score present: {pricing.get('confidence_score')}")

def test_5_and_6_purchase_gated_reviews():
    print_test("5 & 6. Purchase-Based Product Reviews & Display Gate")
    
    # 1. Fetch an existing product
    prods_res = requests.get(f"{BASE_URL}/products")
    assert_true(prods_res.status_code == 200, "Retrieved product catalogue")
    prods = prods_res.json()
    assert_true(len(prods) > 0, "At least one product in catalogue")
    product_id = prods[0]["id"]
    test_buyer_id = f"CRF-BUY-{int(time.time())}"
    test_buyer_name = "Pooja Hegde"
    
    # 2. Check Review Eligibility BEFORE purchase -> Expect canReview: False
    elig_res = requests.get(f"{BASE_URL}/products/{product_id}/reviews/eligibility?buyer_id={test_buyer_id}")
    assert_true(elig_res.status_code == 200, "Eligibility endpoint reachable")
    elig = elig_res.json()
    assert_true(elig.get("canReview") is False, "Buyer cannot review unpurchased product")
    assert_true(elig.get("reason") == "PRODUCT_NOT_PURCHASED", f"Reason is PRODUCT_NOT_PURCHASED (got: {elig.get('reason')})")
    
    # 3. Direct POST review before purchase -> Expect HTTP 403 REVIEW_NOT_ALLOWED
    rev_payload = {
        "buyer_id": test_buyer_id,
        "buyer_name": test_buyer_name,
        "rating": 5,
        "comment": "Illegitimate review before purchase attempt"
    }
    unauth_rev = requests.post(f"{BASE_URL}/products/{product_id}/reviews", json=rev_payload)
    assert_true(unauth_rev.status_code == 403, f"Review submission without purchase rejected with HTTP 403: {unauth_rev.status_code}")
    
    # 4. Make a real purchase (Order creation)
    order_payload = {
        "buyer_id": test_buyer_id,
        "buyer_name": test_buyer_name,
        "product_id": product_id,
        "amount": prods[0].get("price", 1500),
        "items": [{"product_id": product_id, "quantity": 1, "price": prods[0].get("price", 1500)}]
    }
    order_res = requests.post(f"{BASE_URL}/orders", json=order_payload)
    assert_true(order_res.status_code == 201, f"Purchase order created successfully: {order_res.text}")
    order_data = order_res.json()
    assert_true(order_data.get("status") == "COMPLETED", f"Order status is COMPLETED (got: {order_data.get('status')})")
    
    # 5. Check Review Eligibility AFTER purchase -> Expect canReview: True
    elig_after = requests.get(f"{BASE_URL}/products/{product_id}/reviews/eligibility?buyer_id={test_buyer_id}")
    assert_true(elig_after.status_code == 200, "Eligibility checked after order")
    elig_post = elig_after.json()
    assert_true(elig_post.get("canReview") is True, f"Buyer is now verified and eligible to review: {elig_post}")
    
    # 6. Submit Verified Review
    valid_rev_payload = {
        "buyer_id": test_buyer_id,
        "buyer_name": test_buyer_name,
        "rating": 5,
        "comment": "Exquisite handmade authentic craftsmanship! Perfect finish and fast delivery."
    }
    submit_res = requests.post(f"{BASE_URL}/products/{product_id}/reviews", json=valid_rev_payload)
    assert_true(submit_res.status_code == 201, f"Verified review created with HTTP 201: {submit_res.text}")
    
    # 7. Duplicate review attempt -> Expect HTTP 400/409 ALREADY_REVIEWED
    dup_res = requests.post(f"{BASE_URL}/products/{product_id}/reviews", json=valid_rev_payload)
    assert_true(dup_res.status_code in [400, 409], f"Duplicate review prevented with HTTP {dup_res.status_code}: {dup_res.text}")
    
    # 8. Fetch product reviews -> Expect our new review to be present
    rev_list_res = requests.get(f"{BASE_URL}/products/{product_id}/reviews")
    assert_true(rev_list_res.status_code == 200, "Fetched product reviews")
    rev_overview = rev_list_res.json()
    assert_true(rev_overview.get("total_reviews") >= 1, f"Total reviews >= 1 (got: {rev_overview.get('total_reviews')})")
    matched_rev = next((r for r in rev_overview["reviews"] if r["buyer_id"] == test_buyer_id), None)
    assert_true(matched_rev is not None, "Newly submitted review appears in public reviews list")
    assert_true(matched_rev["verified_purchase"] is True, "Review is marked with verified_purchase: True")

def test_7_collision_resistant_ids_and_passports(artisan_id="CRF-ART-001284"):
    print_test("7. Unique Collision-Resistant Product IDs & SHA-256 Provenance Passports")
    
    # Create 2 products using registered artisan
    prod_payload_1 = {
        "title": "Kashmiri Walnut Wood Carved Box",
        "description": "Hand-carved solid walnut box from Srinagar valley.",
        "category": "Woodcraft",
        "materials": ["Walnut Wood", "Natural Lacquer"],
        "price": 2800.0,
        "artisan_id": artisan_id,
        "artisan_name": "Ramesh Kumar",
        "artisan_location": "Srinagar, Jammu & Kashmir",
        "production_time_days": 7
    }
    prod_payload_2 = {
        "title": "Channapatna Wooden Toys Set",
        "description": "Organic vegetable dye lacquerware from Karnataka.",
        "category": "Woodcraft",
        "materials": ["Ivory Wood", "Natural Lac"],
        "price": 950.0,
        "artisan_id": artisan_id,
        "artisan_name": "Ramesh Kumar",
        "artisan_location": "Channapatna, Karnataka",
        "production_time_days": 3
    }
    
    res1 = requests.post(f"{BASE_URL}/products", json=prod_payload_1)
    res2 = requests.post(f"{BASE_URL}/products", json=prod_payload_2)
    
    assert_true(res1.status_code == 201, f"Product 1 created: {res1.text}")
    assert_true(res2.status_code == 201, f"Product 2 created: {res2.text}")
    
    p1 = res1.json()
    p2 = res2.json()
    
    id1 = p1["id"]
    id2 = p2["id"]
    
    print(f"   Product 1 ID: {id1}")
    print(f"   Product 2 ID: {id2}")
    
    # 1. Check Collision-resistant pattern: CRAFTORA-2026-XXXXXXXX
    pattern = r"^CRAFTORA-2026-[A-F0-9]{8}$"
    assert_true(bool(re.match(pattern, id1)), f"Product 1 ID matches pattern {pattern}")
    assert_true(bool(re.match(pattern, id2)), f"Product 2 ID matches pattern {pattern}")
    assert_true(id1 != id2, "Product IDs are unique and collision-resistant")
    
    # 2. Check Digital Provenance Passports & SHA-256 Hashes
    pass1 = p1.get("passport")
    if not pass1 or not pass1.get("passport_id"):
        pass1 = requests.get(f"{BASE_URL}/products/{id1}/passport").json()
        
    pass2 = p2.get("passport")
    if not pass2 or not pass2.get("passport_id"):
        pass2 = requests.get(f"{BASE_URL}/products/{id2}/passport").json()
    
    assert_true(pass1.get("passport_id", "").startswith("DPP-CRAFTORA-"), f"Passport 1 ID format valid: {pass1.get('passport_id')}")
    assert_true(pass2.get("passport_id", "").startswith("DPP-CRAFTORA-"), f"Passport 2 ID format valid: {pass2.get('passport_id')}")
    
    hash1 = pass1.get("provenance_hash") or pass1.get("data_hash") or pass1.get("dataHash")
    hash2 = pass2.get("provenance_hash") or pass2.get("data_hash") or pass2.get("dataHash")
    
    assert_true(bool(hash1 and len(hash1) == 64), f"Product 1 provenance hash is valid 64-char SHA-256: {hash1}")
    assert_true(bool(hash2 and len(hash2) == 64), f"Product 2 provenance hash is valid 64-char SHA-256: {hash2}")
    assert_true(hash1 != hash2, "Distinct craft products have distinct canonical cryptographic provenance hashes")

if __name__ == "__main__":
    print("======================================================================")
    print("  🚀 CRAFTORA PRODUCTION-READY FEATURES VERIFICATION SUITE")
    print("======================================================================")
    
    try:
        token, user = test_1_email_otp_auth()
        test_2_profile_completion_gate(token, user)
        test_3_ai_product_analysis()
        test_4_smart_pricing()
        test_5_and_6_purchase_gated_reviews()
        test_7_collision_resistant_ids_and_passports(user["uid"])
        
        print("\n" + "="*70)
        print("  🎉 ALL 7 PRODUCTION-READY FEATURES TESTED & FULLY VERIFIED!")
        print("======================================================================\n")
    except Exception as e:
        print(f"\n❌ SUITE TERMINATED WITH ERROR: {e}")
        sys.exit(1)
