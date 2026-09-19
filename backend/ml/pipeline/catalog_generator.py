"""
CRAFTORA ML Pipeline — Stage 8: Heritage Storytelling & Digital Product Passport Generator
Generates culturally rich, market-ready catalog content:
- Engaging heritage narrative highlighting the artisan's technique
- Bilingual product titles (English & Hindi)
- Care instructions tailored to authentic materials
- SEO and marketplace discovery tags
- Digital Product Passport (DPP) payload draft
"""

import hashlib
import json
from typing import Dict, Any, List


CRAFT_STORIES = {
    "Bamboo Craft": {
        "title_en": "Handwoven Artisanal Bamboo & Cane Craft",
        "title_hi": "पारंपरिक हस्तनिर्मित बाँस एवं बेंत शिल्प",
        "story": (
            "Handcrafted by master artisans using sustainably harvested golden bamboo and native cane splints. "
            "Each structural bend and interlocking lattice reflects generations of indigenous Assamese craft wisdom. "
            "Lightweight yet remarkably resilient, this piece embodies sustainable, zero-plastic living."
        ),
        "care": "Wipe gently with a soft dry cloth. Avoid prolonged direct soaking; keep in a ventilated area.",
        "tags": ["Handmade", "Eco-friendly", "Assam Craft", "Bamboo Basket", "Sustainable Living", "VocalForLocal", "Artisan Made"]
    },
    "Blue Pottery": {
        "title_en": "Jaipur Glazed Quartz Blue Pottery Artifact",
        "title_hi": "जयपुर पारंपरिक नीली मिट्टी (ब्लू पॉटरी) कलाकृति",
        "story": (
            "Crafted without conventional clay using pulverized quartz, glass frit, and natural gum, this iconic Jaipur Blue Pottery "
            "features radiant floral arabesques hand-painted with cobalt oxide and copper pigments. Fired in traditional low-fire kilns "
            "to achieve its signature turquoise sheen."
        ),
        "care": "Gentle hand wash with mild soap and sponge. Do not place in microwave or dishwasher.",
        "tags": ["Blue Pottery", "Jaipur Heritage", "Ceramic Art", "Cobalt Glaze", "Home Decor", "GI Tagged", "Handpainted"]
    },
    "Madhubani Painting": {
        "title_en": "Authentic Mithila Folk Art Madhubani Painting",
        "title_hi": "पारंपरिक मिथिला मधुबनी हस्तचित्र कला",
        "story": (
            "An ancient art form from the heart of Bihar, painted on handmade paper using bamboo nibs and natural mineral extracts. "
            "Intricate geometric borders and double-line motifs celebrate nature, prosperity, and timeless Mithila folk traditions. "
            "Every stroke is executed entirely freehand."
        ),
        "care": "Keep framed behind UV-protective glass away from direct continuous sunlight and moisture.",
        "tags": ["Madhubani", "Mithila Painting", "Folk Art", "Natural Pigments", "Wall Art", "Indian Heritage", "Handmade Paper"]
    },
    "Handloom Weaving": {
        "title_en": "Heritage Shuttle-Loom Handcrafted Textile",
        "title_hi": "पारंपरिक हथकरघा बुनाई वस्त्र",
        "story": (
            "Woven on traditional wooden pit-looms by master weavers using hand-spun natural yarns and azo-free vegetable dyes. "
            "The rhythmic shuttle movement creates subtle artisanal weave textures and selvedge borders impossible to replicate on power looms. "
            "A timeless celebration of Indian textile excellence."
        ),
        "care": "Dry clean recommended for initial wash; hand wash separately in cold water with mild detergent.",
        "tags": ["Handloom", "Textile", "Pure Cotton", "Artisan Weave", "Ethnic", "Sustainable Fashion", "Indian Weaver"]
    },
    "Terracotta Clay Work": {
        "title_en": "Hand-Moulded Bankura Kiln-Fired Terracotta",
        "title_hi": "हस्तनिर्मित बांकुरा टेराकोटा मिट्टी शिल्प",
        "story": (
            "Sculpted from alluvial riverbed clay and baked in wood-fired earthen kilns, this terracotta creation carries the warm earthy fragrance "
            "and rustic warmth of rural Bengal. Hand-pinched ornamentation and kiln-fire gradations make every single piece uniquely distinct."
        ),
        "care": "Dust with a dry microfibre brush. Avoid dropping on hard surfaces or exposing to water immersion.",
        "tags": ["Terracotta", "Clay Craft", "Bankura", "Earthy Decor", "Kiln Fired", "Hand Sculpted", "Traditional"]
    },
    "Wood Carving": {
        "title_en": "Hand-Carved Sheesham Wood Jali Artifact",
        "title_hi": "हस्तनिर्मित शीशम काष्ठ नक्काशी कलाकृति",
        "story": (
            "Hewn from sustainable Indian Rosewood (Sheesham) by master woodworkers in Saharanpur. Detailed pierced jali lattice "
            "and relief motifs are chiselled by hand and finished with natural mustard oil and beeswax polish to accentuate the deep grain."
        ),
        "care": "Buff occasionally with beeswax or mineral oil to maintain natural wood lustre. Keep away from damp areas.",
        "tags": ["Wood Carving", "Sheesham Wood", "Saharanpur", "Handcrafted Decor", "Jali Work", "Natural Finish"]
    },
    "Dhokra Metal Craft": {
        "title_en": "Ancient Lost-Wax Cast Bastar Dhokra Brass Sculpture",
        "title_hi": "प्राचीन ढोकरा धातु शिल्प (लॉस्ट-वैक्स कास्टिंग)",
        "story": (
            "Produced using the 4,000-year-old lost-wax (cire perdue) bell metal casting technique passed down by Bastar tribal artisans. "
            "Fine beeswax threads wound over a clay core are replaced by molten alloy, giving this heirloom figurine its signature rustic vitality."
        ),
        "care": "Clean with a soft dry cloth. Brass polish can be gently applied to highlight raised relief wires.",
        "tags": ["Dhokra", "Bell Metal", "Lost Wax", "Tribal Art", "Bastar", "Brass Sculpture", "Antique Finish"]
    },
    "Artisanal Leather": {
        "title_en": "Hand-Stitched Vegetable-Tanned Leather Craft",
        "title_hi": "वनस्पति-रंजित हस्तनिर्मित चमड़ा शिल्प",
        "story": (
            "Crafted from eco-friendly vegetable-tanned leather dyed using acacia bark and natural extracts. Hand-punched stitching "
            "and natural beeswax burnishing ensure rugged longevity that develops a rich, distinctive patina with age."
        ),
        "care": "Apply natural leather balm or wax periodically. Keep dry and store in a breathable cloth bag.",
        "tags": ["Leather Craft", "Vegetable Tanned", "Hand Stitched", "Kolhapuri Style", "Sustainable Leather", "Heritage Accessory"]
    }
}


def generate_catalog_story(
    category: str,
    materials: List[str],
    artisan_name: str = "Master Artisan",
    region: str = "India"
) -> Dict[str, Any]:
    """
    Generates structured storytelling description, bilingual titles, and digital passport payload.
    """
    profile = CRAFT_STORIES.get(category, CRAFT_STORIES["Bamboo Craft"])

    # Create Digital Product Passport (DPP) draft structure
    dpp_metadata = {
        "schema_version": "CRAFTORA-DPP-v1.0",
        "category": category,
        "region_of_origin": region,
        "certified_materials": materials,
        "artisan_cooperative": "CRAFTORA Verified Artisan Collective",
        "sustainability_score": "A+ (Eco-Friendly / Low-Carbon)",
        "fair_wage_guarantee": True
    }

    # Generate cryptographic provenance hash
    canonical_json = json.dumps(dpp_metadata, sort_keys=True)
    provenance_hash = f"0x{hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()}"

    return {
        "product_name_en": profile["title_en"],
        "product_name_hi": profile["title_hi"],
        "description": profile["story"],
        "care_instructions": profile["care"],
        "tags": profile["tags"],
        "digital_product_passport": {
            "dpp_id": f"DPP-{hashlib.md5(provenance_hash.encode()).hexdigest()[:10].upper()}",
            "provenance_hash": provenance_hash,
            "provenance_status": "Ready for Ledger Anchor",
            "metadata": dpp_metadata
        }
    }
