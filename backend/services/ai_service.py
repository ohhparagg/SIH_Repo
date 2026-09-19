import os
import re
import json
import ssl
import urllib.request
from pathlib import Path
from typing import Optional, Dict, Any, List

# Load local .env if present
_env_file = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_file.exists():
    try:
        with open(_env_file, "r", encoding="utf-8") as _f:
            for _line in _f:
                _line = _line.strip()
                if _line and not _line.startswith("#") and "=" in _line:
                    _k, _v = _line.split("=", 1)
                    _k, _v = _k.strip(), _v.strip().strip("'\"")
                    if _k not in os.environ:
                        os.environ[_k] = _v
    except Exception:
        pass

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_VISION_MODEL = os.environ.get("GROQ_VISION_MODEL", "llama-3.2-11b-vision-preview")
GROQ_PRIMARY_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_FALLBACK_MODEL = "llama-3.1-8b-instant"

def _query_groq_vision(image_url: str, prompt: str, timeout: float = 12.0) -> Optional[Dict[str, Any]]:
    if not GROQ_API_KEY or not image_url:
        return None
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        payload = {
            "model": GROQ_VISION_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                }
            ],
            "temperature": 0.2
        }

        req = urllib.request.Request(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "CRAFTORA-AI/1.0"
            },
            data=json.dumps(payload).encode("utf-8")
        )

        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as res:
            data = json.loads(res.read().decode("utf-8"))
            if data.get("choices") and len(data["choices"]) > 0:
                raw_text = data["choices"][0]["message"]["content"]
                cleaned = re.sub(r"^```json\s*|\s*```$", "", raw_text.strip(), flags=re.MULTILINE)
                return json.loads(cleaned)
    except Exception as e:
        print(f"Notice: Groq Vision AI query error: {e}")
    return None

def _query_groq(messages: List[Dict[str, str]], model: str = GROQ_PRIMARY_MODEL, timeout: float = 6.0) -> Optional[Dict[str, Any]]:
    if not GROQ_API_KEY:
        return None
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        payload = {
            "model": model,
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.3
        }

        req = urllib.request.Request(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "CRAFTORA-AI/1.0"
            },
            data=json.dumps(payload).encode("utf-8")
        )

        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as res:
            data = json.loads(res.read().decode("utf-8"))
            if data.get("choices") and len(data["choices"]) > 0:
                raw_text = data["choices"][0]["message"]["content"]
                return json.loads(raw_text)
    except Exception as e:
        # Fallback to secondary model or local knowledge base
        if model != GROQ_FALLBACK_MODEL:
            try:
                return _query_groq(messages, model=GROQ_FALLBACK_MODEL, timeout=4.0)
            except Exception:
                pass
        print(f"Notice: Groq AI query note ({e}), using craft domain engine.")
    return None

CRAFT_KNOWLEDGE_BASE = {
    "bamboo": {
        "category": "Bamboo Craft",
        "craft_type": "Assamese Split Bamboo Weaving",
        "default_title": "Handcrafted Bamboo Woven Craft",
        "description": "Eco-friendly, lightweight handcrafted bamboo piece woven with traditional split-cane techniques.",
        "materials": ["Natural Bamboo", "Cane Binding"],
        "tags": ["Handmade", "Eco-friendly", "Traditional", "Bamboo", "Sustainable"],
        "production_time": "2-3 Days",
        "confidence": 0.94
    },
    "pottery": {
        "category": "Blue Pottery",
        "craft_type": "Glazed Quartz Ceramic Artwork",
        "default_title": "Jaipur Blue Glazed Decorative Pottery",
        "description": "Handcrafted quartz-based blue pottery with cobalt and copper oxide floral motifs.",
        "materials": ["Quartz Powder", "Natural Glaze", "Fuller's Earth"],
        "tags": ["Pottery", "Ceramic", "Jaipur", "Blue Glaze", "Home Decor"],
        "production_time": "4 Days",
        "confidence": 0.92
    },
    "madhubani": {
        "category": "Madhubani Painting",
        "craft_type": "Mithila Folk Painting on Handmade Paper",
        "default_title": "Traditional Madhubani Folk Art",
        "description": "Authentic Mithila folk painting created using natural mineral dyes, twigs, and fine line techniques.",
        "materials": ["Handmade Paper", "Natural Mineral Dyes", "Soot Pigment"],
        "tags": ["Folk Art", "Painting", "Madhubani", "Heritage", "Natural Dyes"],
        "production_time": "5 Days",
        "confidence": 0.96
    },
    "textile": {
        "category": "Handloom Weaving",
        "craft_type": "Heritage Handloom Loom Work",
        "default_title": "Authentic Handloom Heritage Textile",
        "description": "Handwoven heritage fabric with artisanal border patterns and natural thread dyes.",
        "materials": ["Pure Cotton", "Silk Thread", "Natural Vegetable Dyes"],
        "tags": ["Handloom", "Textile", "Heritage", "Sustainable"],
        "production_time": "6 Days",
        "confidence": 0.91
    },
    "terracotta": {
        "category": "Terracotta Clay Work",
        "craft_type": "Kiln-Fired Clay Sculpture",
        "default_title": "Hand-Moulded Terracotta Sculpture",
        "description": "Hand-moulded natural clay craft kiln-fired for authentic earthy warmth and texture.",
        "materials": ["Riverbed Clay", "Natural Earth Pigments"],
        "tags": ["Terracotta", "Clay", "Handmade", "Earthy"],
        "production_time": "3 Days",
        "confidence": 0.89
    }
}

class AIService:
    @staticmethod
    def analyze_product_image(
        filename: Optional[str] = None,
        artisan_id: Optional[str] = None,
        artisan_craft: Optional[str] = None,
        language: str = "EN",
        image_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        AI vision analyzer with multimodal vision support.
        Supports unseen products via Groq Llama-3.2-Vision and provides honest service status.
        """
        # If real image data is provided, attempt true vision analysis first
        if image_url and GROQ_API_KEY:
            vision_prompt = (
                f"You are an expert product analyzer and cataloguer. Analyze the uploaded product image. "
                f"Language requirement: {language.upper()}. "
                f"Return valid JSON only with keys:\n"
                f"- product_name: Accurate, concise title (e.g. Ballpoint Pen, Leather Shoe, Bamboo Basket)\n"
                f"- category: Accurate category (e.g. Writing Instrument, Footwear, Drinkware, Bamboo Craft). If uncertain, write 'Needs Review'\n"
                f"- craft_type: Technique or sub-category if applicable, or 'N/A'\n"
                f"- materials: Array of visible material strings (e.g. ['Plastic', 'Metal']). If not determinable, write ['Material could not be reliably determined from the image.']\n"
                f"- description: Objective description based on visible characteristics (2 sentences)\n"
                f"- tags: Array of 4-5 relevant search tags\n"
                f"- confidence: 'High confidence' or 'Needs review' or 'Low confidence'\n"
                f"- suggested_price: Indicative fair Indian Rupee integer price\n"
                f"CRITICAL: Do NOT force everyday non-handicraft objects into crafts. Never invent details."
            )
            v_res = _query_groq_vision(image_url, vision_prompt)
            if v_res and isinstance(v_res, dict) and v_res.get("product_name"):
                return {
                    "analysisStatus": "success",
                    "ai_generated": True,
                    "ai_engine": "Groq Llama-3.2 Vision Model",
                    "product_name": str(v_res.get("product_name", "Needs Review")),
                    "category": str(v_res.get("category", "Needs Review")),
                    "craft_type": str(v_res.get("craft_type", "Standard")),
                    "description": str(v_res.get("description", "AI-generated description based on visible characteristics.")),
                    "materials": v_res.get("materials") if isinstance(v_res.get("materials"), list) else [str(v_res.get("materials", "N/A"))],
                    "tags": v_res.get("tags") if isinstance(v_res.get("tags"), list) else ["product"],
                    "confidence": v_res.get("confidence", "High confidence"),
                    "suggested_price": v_res.get("suggested_price", 650),
                    "isDemoFallback": False
                }

        name_lower = (filename or "").lower()
        craft_lower = (artisan_craft or "").lower()
        combined = f"{name_lower} {craft_lower}"

        is_bamboo = "bamboo" in combined or "basket" in combined

        # If this is specifically the bamboo basket demo:
        if is_bamboo:
            info = CRAFT_KNOWLEDGE_BASE["bamboo"]
            desc = "पारंपरिक असमी बुनाई तकनीक से बना हस्तनिर्मित पर्यावरण-अनुकूल बाँस का उत्पाद।" if language.upper() == "HI" else info["description"]
            return {
                "analysisStatus": "success",
                "ai_generated": True,
                "ai_mode": "demo",
                "ai_model_label": "CRAFTORA Vision Demo Engine (Bamboo Basket Reference)",
                "product_name": info["default_title"],
                "category": info["category"],
                "craft_type": info["craft_type"],
                "description": desc,
                "materials": info["materials"],
                "tags": info["tags"],
                "production_time": info["production_time"],
                "confidence": "High confidence",
                "suggested_price": 650,
                "isDemoFallback": True,
                "disclaimer": "AI Generated / Demo AI. Artisan can edit and override all generated attributes."
            }

        # For any unseen product without vision API key:
        return {
            "analysisStatus": "error",
            "errorType": "service_unavailable",
            "message": "AI analysis is temporarily unavailable. Vision API key (GROQ_API_KEY) is required on server for new/unseen objects."
        }

    @staticmethod
    def voice_to_product(transcript: str, language: str = "EN", artisan_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Parses spoken artisan description (Hindi or English) into structured catalog fields.
        """
        t = transcript.strip()
        t_lower = t.lower()

        # Detect craft keyword
        detected_category = "Bamboo Craft"
        craft_type = "Handwoven Bamboo Work"
        materials = ["Natural Bamboo"]

        if any(w in t_lower for w in ["pottery", "ceramic", "मिट्टी", "बर्तन", "घड़ा"]):
            detected_category = "Blue Pottery"
            craft_type = "Glazed Quartz Ceramic"
            materials = ["Quartz Powder", "Glaze"]
        elif any(w in t_lower for w in ["madhubani", "mithila", "painting", "चित्र", "पेंटिंग"]):
            detected_category = "Madhubani Painting"
            craft_type = "Mithila Folk Painting"
            materials = ["Handmade Paper", "Natural Dyes"]
        elif any(w in t_lower for w in ["saree", "shawl", "cloth", "textile", "कपड़ा", "साड़ी"]):
            detected_category = "Handloom Weaving"
            craft_type = "Traditional Loom Weave"
            materials = ["Pure Cotton", "Silk"]
        elif any(w in t_lower for w in ["terracotta", "clay", "टेराकोटा"]):
            detected_category = "Terracotta Clay Work"
            craft_type = "Kiln-Fired Clay"
            materials = ["Riverbed Clay"]

        # Extract title from first sentence
        first_sentence = re.split(r"[.।\n]", t)[0].strip()
        product_name = first_sentence if (5 < len(first_sentence) < 60) else f"Handcrafted {detected_category}"

        # Location heuristic
        location = "Assam, India"
        loc_match = re.search(r"(?:from|in|live in|रहता हूँ|रहती हूँ|से हूँ)\s+([a-zA-Z\u0900-\u097f ,]+)", t, re.IGNORECASE)
        if loc_match:
            location = loc_match.group(1).strip()

        # Attempt Groq Voice NLP extraction
        groq_prompt = (
            f"An Indian artisan spoke this description: '{transcript}' in {language}. "
            f"Extract structured craft catalog information into JSON with keys:\n"
            f"- product_name: A short descriptive title\n"
            f"- category: Craft category\n"
            f"- craft_type: Specific craft technique\n"
            f"- description: Full polished product description\n"
            f"- materials: Array of raw materials\n"
            f"- location: Region or state if mentioned\n"
            f"- production_time: Estimated crafting duration\n"
        )
        groq_voice = _query_groq([
            {"role": "system", "content": "You parse spoken audio transcripts from rural artisans into catalog fields. Output JSON only."},
            {"role": "user", "content": groq_prompt}
        ], timeout=5.0)

        if groq_voice and isinstance(groq_voice, dict) and groq_voice.get("product_name"):
            return {
                "ai_generated": True,
                "ai_mode": "demo",
                "ai_engine": "Groq Llama-3 / GPT-OSS Speech & NLP",
                "product_name": str(groq_voice.get("product_name", product_name)),
                "category": str(groq_voice.get("category", detected_category)),
                "craft_type": str(groq_voice.get("craft_type", craft_type)),
                "description": str(groq_voice.get("description", t)),
                "materials": groq_voice.get("materials") if isinstance(groq_voice.get("materials"), list) else materials,
                "production_time": str(groq_voice.get("production_time", "2-3 Days")),
                "location": str(groq_voice.get("location", location)),
                "confidence": 0.95,
                "disclaimer": "AI Generated via Groq Voice Engine. Review and edit before saving."
            }

        return {
            "ai_generated": True,
            "ai_mode": "demo",
            "product_name": product_name,
            "category": detected_category,
            "craft_type": craft_type,
            "description": t if len(t) > 10 else f"Authentic handcrafted {detected_category}.",
            "materials": materials,
            "production_time": "2-3 Days",
            "location": location,
            "confidence": 0.91,
            "disclaimer": "AI Generated / Demo AI. Review and edit before saving."
        }

    @staticmethod
    def enhance_image(image_bytes: Optional[bytes] = None, filename: str = "craft.png") -> Dict[str, Any]:
        """
        Demo image enhancement simulation.
        Clearly states that this is prototype contrast & lighting normalization.
        """
        return {
            "success": True,
            "mode": "demo",
            "message": "Demo image enhancement completed (simulated white balance & background illumination)",
            "image_url": f"assets/{filename}",
            "original_filename": filename,
            "filters_applied": [
                "Auto-Exposure Correction (Simulated)",
                "Warm Heritage Colour Temperature Balancing",
                "Studio Lighting Shadow Reduction"
            ]
        }
