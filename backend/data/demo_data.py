"""
CRAFTORA Authentic In-Memory Seed Data and Store.
Indian Regional Crafts: Bamboo (Assam), Madhubani (Bihar), Blue Pottery (Jaipur), Phulkari (Punjab).
All records are linked through relational IDs.
"""

import threading
from typing import Dict, Any, List

_LOCK = threading.Lock()

# Global in-memory dictionaries keyed by primary ID
ARTISANS: Dict[str, Dict[str, Any]] = {}
PRODUCTS: Dict[str, Dict[str, Any]] = {}
BUYERS: Dict[str, Dict[str, Any]] = {}
INQUIRIES: Dict[str, Dict[str, Any]] = {}
PASSPORTS: Dict[str, Dict[str, Any]] = {}
PROVENANCE_EVENTS: Dict[str, List[Dict[str, Any]]] = {}  # passport_id -> list of events
USERS: Dict[str, Dict[str, Any]] = {}  # user_id / email -> user profile
OTP_SESSIONS: Dict[str, Dict[str, Any]] = {}  # email -> active otp verification session
ORDERS: Dict[str, Dict[str, Any]] = {}  # order_id -> order details
REVIEWS: Dict[str, Dict[str, Any]] = {}  # review_id -> review details

def init_demo_data():
    with _LOCK:
        ARTISANS.clear()
        PRODUCTS.clear()
        BUYERS.clear()
        INQUIRIES.clear()
        PASSPORTS.clear()
        PROVENANCE_EVENTS.clear()

        # ── 1. SEED ARTISANS ─────────────────────────────────────────
        ARTISANS["CRF-ART-001284"] = {
            "artisan_id": "CRF-ART-001284",
            "name": "Ramesh Kumar",
            "craft": "Bamboo Craft",
            "craft_type": "Handwoven Cane & Bamboo Lattice",
            "location": "Nalbari, Assam",
            "state": "Assam",
            "bio": "Ramesh is a traditional bamboo artisan from Assam. His craft reflects local weaving techniques passed through generations.",
            "craft_story": "Sourcing natural golden bamboo from local groves, cured using traditional smoke and water treatment for lifelong durability.",
            "years_experience": 18,
            "languages": ["en", "hi", "as"],
            "verification_status": "VERIFIED",
            "photo_url": "assets/artisan_ramesh.png",
            "created_at": "17 Sep 2026",
            "productCount": 2,
            "passportCount": 2
        }

        ARTISANS["CRF-ART-001285"] = {
            "artisan_id": "CRF-ART-001285",
            "name": "Sita Devi",
            "craft": "Madhubani Painting",
            "craft_type": "Mithila Folk Painting on Handmade Paper",
            "location": "Madhubani, Bihar",
            "state": "Bihar",
            "bio": "Sita Devi practices authentic Mithila and Madhubani painting techniques using natural dyes and handmade paper.",
            "craft_story": "Creating geometric and floral folk art using bamboo twigs, soot, turmeric, and marigold flower extracts.",
            "years_experience": 22,
            "languages": ["en", "hi"],
            "verification_status": "VERIFIED",
            "photo_url": "assets/madhubani_art.png",
            "created_at": "15 Sep 2026",
            "productCount": 1,
            "passportCount": 1
        }

        ARTISANS["CRF-ART-001286"] = {
            "artisan_id": "CRF-ART-001286",
            "name": "Manoj Prajapati",
            "craft": "Blue Pottery",
            "craft_type": "Glazed Quartz Ceramic Artwork",
            "location": "Kot Jewar, Jaipur",
            "state": "Rajasthan",
            "bio": "Fourth-generation master potter preserving the Persian-origin Turko-Jaipur blue glazed technique without using traditional clay.",
            "craft_story": "Formulated from powdered quartz, Fuller's earth, gum, and copper oxide blue glaze.",
            "years_experience": 14,
            "languages": ["en", "hi"],
            "verification_status": "PENDING",
            "photo_url": "assets/artisan_ramesh.png",
            "created_at": "18 Sep 2026",
            "productCount": 1,
            "passportCount": 0
        }

        # ── 2. SEED BUYERS ───────────────────────────────────────────
        BUYERS["BUY-001"] = {
            "buyer_id": "BUY-001",
            "name": "Arjun Sharma",
            "buyer_type": "Retail Store",
            "location": "New Delhi, India",
            "interests": ["Bamboo Craft", "Home Storage", "Sustainable Decor"],
            "intended_use": "Curated lifestyle boutique retail inventory",
            "email": "arjun@sharmacrafts.in",
            "mobile_number": "+91 9876543210",
            "created_at": "10 Sep 2026"
        }

        BUYERS["BUY-002"] = {
            "buyer_id": "BUY-002",
            "name": "Priya Nair",
            "buyer_type": "Interior Designer",
            "location": "Bengaluru, Karnataka",
            "interests": ["Bamboo Craft", "Traditional Lighting", "Terracotta"],
            "intended_use": "Eco-resort lobby and boutique restaurant projects",
            "email": "priya@nairdesign.com",
            "mobile_number": "+91 9811122233",
            "created_at": "12 Sep 2026"
        }

        BUYERS["BUY-003"] = {
            "buyer_id": "BUY-003",
            "name": "Rajesh Gupta",
            "buyer_type": "Corporate Gifting Company",
            "location": "Mumbai, Maharashtra",
            "interests": ["Handmade Paper", "Madhubani Painting", "Eco Gifts"],
            "intended_use": "Executive Diwali and corporate sustainable hamper collections",
            "email": "rgupta@giftsofindia.co.in",
            "mobile_number": "+91 9922233445",
            "created_at": "14 Sep 2026"
        }

        # ── 3. SEED PRODUCTS ─────────────────────────────────────────
        PRODUCTS["CRF-BAM-001284"] = {
            "product_id": "CRF-BAM-001284",
            "artisan_id": "CRF-ART-001284",
            "name": "Bamboo Handwoven Basket",
            "category": "Bamboo Craft",
            "craft_type": "Assamese Traditional Split Bamboo Weaving",
            "description": "Handcrafted bamboo basket made using traditional Assamese weaving techniques. Durable, eco-friendly, and lightweight.",
            "materials": ["Natural Bamboo", "Cane Binding"],
            "tags": ["Handmade", "Eco-friendly", "Traditional", "Bamboo", "Storage"],
            "production_time": "2 Days",
            "production_days": 2,
            "image": "assets/bamboo_basket.png",
            "enhanced_image": "assets/bamboo_basket.png",
            "price": 680.0,
            "cost_breakdown": {
                "material_cost": 180.0,
                "labour_cost": 250.0,
                "production_days": 2,
                "packaging_cost": 40.0,
                "total_estimated_cost": 470.0
            },
            "ai_insight": {
                "market_demand": "High",
                "similar_price_range": {"min": 550.0, "max": 750.0},
                "indicative_price_range": {"min": 650.0, "max": 700.0},
                "suggested_price": 680.0,
                "confidence_score": 0.94,
                "label": "AI Indicative Price Recommendation"
            },
            "buyer_matches": [
                {
                    "id": "M1",
                    "buyer_id": "BUY-001",
                    "buyer_name": "Arjun Sharma",
                    "buyer_type": "Retail Store",
                    "buyer_category": "Handicraft Retailer",
                    "match_percentage": 94,
                    "looking_for": "Bamboo crafts",
                    "requirement": "Seeking eco-friendly home storage inventory",
                    "reason": "Matches retailer craft preference (Bamboo) and price range"
                },
                {
                    "id": "M2",
                    "buyer_id": "BUY-002",
                    "buyer_name": "Priya Nair",
                    "buyer_type": "Interior Designer",
                    "buyer_category": "Hospitality & Decor Buyer",
                    "match_percentage": 88,
                    "looking_for": "Handmade decor",
                    "requirement": "Resort lobby & dining table accent pieces",
                    "reason": "Natural organic bamboo aligns with eco-resort interior spec"
                }
            ],
            "status": "VERIFIED",
            "created_at": "17 Sep 2026",
            "updated_at": "17 Sep 2026",
            "review_note": "Verified by Admin (Govt Handicraft Board Sample Review)"
        }

        PRODUCTS["CRF-MAD-001285"] = {
            "product_id": "CRF-MAD-001285",
            "artisan_id": "CRF-ART-001285",
            "name": "Madhubani Artwork",
            "category": "Madhubani Painting",
            "craft_type": "Mithila Folk Motifs",
            "description": "Intricate traditional Madhubani painting depicting nature and cultural folk motifs on handmade paper.",
            "materials": ["Handmade Paper", "Natural Dyes", "Charcoal Soot"],
            "tags": ["Folk Art", "Handmade Paper", "Natural Dyes", "Bihar Heritage"],
            "production_time": "5 Days",
            "production_days": 5,
            "image": "assets/madhubani_art.png",
            "enhanced_image": "assets/madhubani_art.png",
            "price": 1200.0,
            "cost_breakdown": {
                "material_cost": 350.0,
                "labour_cost": 600.0,
                "production_days": 5,
                "packaging_cost": 50.0,
                "total_estimated_cost": 1000.0
            },
            "ai_insight": {
                "market_demand": "High",
                "similar_price_range": {"min": 1000.0, "max": 1500.0},
                "indicative_price_range": {"min": 1150.0, "max": 1300.0},
                "suggested_price": 1200.0,
                "confidence_score": 0.96,
                "label": "AI Indicative Price Recommendation"
            },
            "buyer_matches": [
                {
                    "id": "M3",
                    "buyer_id": "BUY-003",
                    "buyer_name": "Rajesh Gupta",
                    "buyer_type": "Corporate Gifting Company",
                    "buyer_category": "Art Gallery & Decor",
                    "match_percentage": 96,
                    "looking_for": "Heritage Folk Art",
                    "requirement": "Corporate gift collection and exhibition pieces",
                    "reason": "High demand for authentic certified Mithila paintings"
                }
            ],
            "status": "VERIFIED",
            "created_at": "15 Sep 2026",
            "updated_at": "15 Sep 2026",
            "review_note": "Approved with digital passport generation"
        }

        PRODUCTS["CRF-BAM-001286"] = {
            "product_id": "CRF-BAM-001286",
            "artisan_id": "CRF-ART-001284",
            "name": "Bamboo Woven Table Lamp",
            "category": "Bamboo Craft",
            "craft_type": "Ambient Geometric Lattice",
            "description": "Handcrafted bamboo ambient table lamp projecting geometric shadow patterns.",
            "materials": ["Natural Bamboo", "Woven Mesh", "Brass Fitting"],
            "tags": ["Lighting", "Bamboo", "Eco-friendly", "Home Decor"],
            "production_time": "3 Days",
            "production_days": 3,
            "image": "assets/bamboo_lamp.png",
            "enhanced_image": "assets/bamboo_lamp.png",
            "price": 950.0,
            "cost_breakdown": {
                "material_cost": 280.0,
                "labour_cost": 400.0,
                "production_days": 3,
                "packaging_cost": 60.0,
                "total_estimated_cost": 740.0
            },
            "ai_insight": {
                "market_demand": "High",
                "similar_price_range": {"min": 850.0, "max": 1200.0},
                "indicative_price_range": {"min": 900.0, "max": 1000.0},
                "suggested_price": 950.0,
                "confidence_score": 0.93,
                "label": "AI Indicative Price Recommendation"
            },
            "buyer_matches": [
                {
                    "id": "M4",
                    "buyer_id": "BUY-002",
                    "buyer_name": "Priya Nair",
                    "buyer_type": "Interior Designer",
                    "buyer_category": "Boutique Home Decor",
                    "match_percentage": 91,
                    "looking_for": "Ambient Bamboo Lamps",
                    "requirement": "Modern eco-lighting fixtures for hospitality",
                    "reason": "Matches lighting category and handmade criteria"
                }
            ],
            "status": "VERIFIED",
            "created_at": "18 Sep 2026",
            "updated_at": "18 Sep 2026",
            "review_note": "Verified"
        }

        # ── 4. SEED PASSPORTS & PROVENANCE ────────────────────────────
        PASSPORTS["CRF-PAS-001284"] = {
            "passport_id": "CRF-PAS-001284",
            "product_id": "CRF-BAM-001284",
            "artisan_id": "CRF-ART-001284",
            "product_name": "Bamboo Handwoven Basket",
            "craft": "Bamboo Craft",
            "craft_type": "Assamese Traditional Split Bamboo Weaving",
            "origin": "Nalbari, Assam",
            "materials": ["Natural Bamboo", "Cane Binding"],
            "production_time": "2 Days",
            "registration_date": "17 Sep 2026",
            "verification_status": "VERIFIED",
            "verification_url": "http://localhost:8000/api/verify/CRF-PAS-001284"
        }

        PROVENANCE_EVENTS["CRF-PAS-001284"] = [
            {
                "event_id": "EVT-001",
                "passport_id": "CRF-PAS-001284",
                "event_type": "PRODUCT_REGISTERED",
                "description": "Product catalog draft created by artisan Ramesh Kumar",
                "timestamp": "17 Sep 2026 10:15 IST",
                "record_hash": "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
                "status": "Completed"
            },
            {
                "event_id": "EVT-002",
                "passport_id": "CRF-PAS-001284",
                "event_type": "ARTISAN_LINKED",
                "description": "Artisan credentials and origin (Nalbari, Assam) verified",
                "timestamp": "17 Sep 2026 11:30 IST",
                "record_hash": "0x8e23a4b91238df11902834019284019283401928301928301928301928301928",
                "status": "Completed"
            },
            {
                "event_id": "EVT-003",
                "passport_id": "CRF-PAS-001284",
                "event_type": "ADMIN_VERIFIED",
                "description": "CRAFTORA admin verification approved and DPP recorded",
                "timestamp": "17 Sep 2026 14:00 IST",
                "record_hash": "0x9182374091823740918237409182374091823740918237409182374091823740",
                "status": "Completed"
            }
        ]

        PASSPORTS["CRF-PAS-001285"] = {
            "passport_id": "CRF-PAS-001285",
            "product_id": "CRF-MAD-001285",
            "artisan_id": "CRF-ART-001285",
            "product_name": "Madhubani Artwork",
            "craft": "Madhubani Painting",
            "craft_type": "Mithila Folk Motifs",
            "origin": "Madhubani, Bihar",
            "materials": ["Handmade Paper", "Natural Dyes"],
            "production_time": "5 Days",
            "registration_date": "15 Sep 2026",
            "verification_status": "VERIFIED",
            "verification_url": "http://localhost:8000/api/verify/CRF-PAS-001285"
        }

        PROVENANCE_EVENTS["CRF-PAS-001285"] = [
            {
                "event_id": "EVT-004",
                "passport_id": "CRF-PAS-001285",
                "event_type": "PRODUCT_REGISTERED",
                "description": "Artwork registered by Sita Devi",
                "timestamp": "15 Sep 2026 09:30 IST",
                "record_hash": "0x5a11b22c33d44e55f66a77b88c99d00e11f22a33b44c55d66e77f88a99b00c11",
                "status": "Completed"
            },
            {
                "event_id": "EVT-005",
                "passport_id": "CRF-PAS-001285",
                "event_type": "ADMIN_VERIFIED",
                "description": "Folk art heritage certification reviewed and approved",
                "timestamp": "15 Sep 2026 16:45 IST",
                "record_hash": "0x6b22c33d44e55f66a77b88c99d00e11f22a33b44c55d66e77f88a99b00c11d22",
                "status": "Completed"
            }
        ]

        # ── 5. SEED INQUIRIES ────────────────────────────────────────
        INQUIRIES["REQ-001"] = {
            "inquiry_id": "REQ-001",
            "buyer_id": "BUY-001",
            "artisan_id": "CRF-ART-001284",
            "product_id": "CRF-BAM-001284",
            "type": "BULK_WHOLESALE",
            "message": "Interested in carrying 50 units for our craft boutique chain in Delhi and Gurgaon.",
            "quantity": 50,
            "status": "PENDING",
            "created_at": "18 Sep 2026",
            "updated_at": "18 Sep 2026",
            "buyer_name": "Arjun Sharma",
            "artisan_name": "Ramesh Kumar",
        }

        # Check and merge any persisted records
        load_storage()

def save_storage():
    """Saves non-demo custom created products and artisans to local disk."""
    import os, json
    try:
        storage_path = os.path.join(os.path.dirname(__file__), "storage.json")
        with open(storage_path, "w", encoding="utf-8") as f:
            json.dump({
                "ARTISANS": ARTISANS,
                "PRODUCTS": PRODUCTS,
                "INQUIRIES": INQUIRIES,
                "PASSPORTS": PASSPORTS,
                "PROVENANCE_EVENTS": PROVENANCE_EVENTS,
                "USERS": USERS,
                "ORDERS": ORDERS,
                "REVIEWS": REVIEWS
            }, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Notice saving storage: {e}")

def load_storage():
    """Loads previously saved records from local disk."""
    import os, json
    try:
        storage_path = os.path.join(os.path.dirname(__file__), "storage.json")
        if os.path.exists(storage_path):
            with open(storage_path, "r", encoding="utf-8") as f:
                saved = json.load(f)
                if isinstance(saved, dict):
                    ARTISANS.update(saved.get("ARTISANS", {}))
                    PRODUCTS.update(saved.get("PRODUCTS", {}))
                    INQUIRIES.update(saved.get("INQUIRIES", {}))
                    PASSPORTS.update(saved.get("PASSPORTS", {}))
                    PROVENANCE_EVENTS.update(saved.get("PROVENANCE_EVENTS", {}))
                    USERS.update(saved.get("USERS", {}))
                    ORDERS.update(saved.get("ORDERS", {}))
                    REVIEWS.update(saved.get("REVIEWS", {}))
    except Exception as e:
        print(f"Notice loading storage: {e}")

init_demo_data()
