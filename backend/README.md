# CRAFTORA Backend — AI-Powered Digital Business Platform for Artisans
**Smart India Hackathon (SIH 2026) | Problem Statement: SIH26090**

CRAFTORA provides a FastAPI backend designed around the handicraft lifecycle:
**CREATE → PRICE → CONNECT → VERIFY**.

---

## 1. What the Backend Does

- **Artisan Management**: Complete CRUD for artisan profiles, experience records, languages, and dashboard metrics.
- **Product & Craft Cataloguing**: Comprehensive craft listings with materials, tags, images, and lifecycle statuses.
- **AI Cataloguing & Voice Assistant**: Multimodal draft extraction from craft photos and spoken audio/transcripts (Hindi `hi-IN` & English `en-IN`), plus lighting enhancement simulation.
- **Smart Pricing Engine**: Transparent cost itemization (Raw Materials + Labour Wages + Production Days + Packaging) plus an AI Indicative Selling Price from a **RandomForestRegressor trained on CRAFTORA's own seed pricing dataset** (`backend/data/pricing_dataset.csv`, see `backend/ml/`) — not a hardcoded multiplier. Falls back to a transparent cost-plus-margin formula if the trained model file is ever unavailable.
- **Rule-Based Buyer Matching**: Sourcing recommendations connecting crafts with commercial retailers, interior designers, and corporate gifting buyers.
- **Buyer Inquiries & Direct Connect**: Wholesale, custom order, and direct retail purchase requests linked to artisans.
- **Digital Product Passport (DPP)**: Immutable craft identity passport linked to physical items via QR verification.
- **Prototype Provenance Ledger**: Tamper-evident event timeline using deterministic SHA-256 hashes simulating testnet blockchain event logs.
- **Admin Verification Portal**: Governance queues for auditing artisan credentials, verifying crafts, approving passports, and recording provenance logs.

---

## 2. Project Structure

```text
backend/
├── main.py                        # FastAPI application & CORS configuration
├── requirements.txt               # Dependencies (FastAPI, Uvicorn, Pydantic, python-multipart)
├── README.md                      # Comprehensive documentation
│
├── routers/                       # Modular REST API endpoints
│   ├── health.py                  # Health check (/api/health)
│   ├── artisans.py                # Artisan CRUD & dashboard
│   ├── products.py                # Product CRUD & passport lookup
│   ├── ai.py                      # AI analysis, voice parser, image enhance
│   ├── pricing.py                 # Cost calculator & indicative price engine
│   ├── buyers.py                  # Buyer registration & buyer matching
│   ├── inquiries.py               # Wholesale & retail inquiries
│   ├── passports.py               # Digital Product Passport issuance & retrieval
│   ├── provenance.py              # Provenance ledger events
│   ├── verification.py            # Public QR verification endpoint (/api/verify/{id})
│   └── admin.py                   # Compliance audit queue, approvals & logs
│
├── services/                      # Pure business logic layer
│   ├── ai_service.py              # Multimodal craft categorization & voice parser
│   ├── pricing_service.py         # Cost & margin formulas
│   ├── matching_service.py        # Buyer pairing heuristics
│   ├── passport_service.py        # DPP generation
│   └── provenance_service.py      # Tamper-evident SHA-256 event log
│
├── models/                        # Pydantic data schemas & validation
│   ├── common.py                  # Enums (VerificationStatus, ProductStatus, etc.)
│   ├── artisan.py                 # Artisan models & dashboard stats
│   ├── product.py                 # Product, CostBreakdown, AIInsight models
│   ├── buyer.py                   # Buyer profile schemas
│   ├── inquiry.py                 # Inquiries schemas
│   └── passport.py                # DPP & Provenance event schemas
│
└── data/
    └── demo_data.py               # In-memory thread-safe seed data store
```

---

## 3. Installation & Setup (macOS / Linux)

### Step 1: Clone and Navigate
```bash
cd SIH_Repo
```

### Step 2: Create Python Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Required Dependencies
```bash
pip install -r backend/requirements.txt
```

---

## 4. Running the Backend

From the repository root with virtual environment activated:

```bash
uvicorn backend.main:app --reload --port 8000
```

The API will start at:
- **Base URL**: `http://localhost:8000/`
- **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 5. How the Frontend Connects

- The frontend runs on `http://localhost:3456/` via `server.js` (Node.js).
- The frontend module `js/services/api.js` communicates with the backend at `http://localhost:8000/api` using standard `fetch()`.
- Both servers run concurrently and independently.
- FastAPI's CORS middleware allows cross-origin requests from `http://localhost:3456`.
- If the backend is temporarily offline, the frontend gracefully falls back to local data so demonstrations are never interrupted.

---

## 6. Available APIs Summary

| Area | Method | Path | Description |
| :--- | :--- | :--- | :--- |
| **Health** | `GET` | `/api/health` | Health & version check |
| **Artisans** | `POST` | `/api/artisans` | Register new artisan |
| | `GET` | `/api/artisans` | List all artisans (with filters) |
| | `GET` | `/api/artisans/{artisan_id}` | Get artisan profile |
| | `PUT` | `/api/artisans/{artisan_id}` | Update artisan profile |
| | `DELETE` | `/api/artisans/{artisan_id}` | Remove artisan |
| | `GET` | `/api/artisans/{artisan_id}/dashboard` | Real-time artisan statistics |
| **Products** | `POST` | `/api/products` | Create product listing |
| | `GET` | `/api/products` | List products (by category/artisan) |
| | `GET` | `/api/products/{product_id}` | Product details |
| | `PUT` | `/api/products/{product_id}` | Update product details |
| | `DELETE` | `/api/products/{product_id}` | Delete product |
| | `GET` | `/api/products/{product_id}/passport` | Lookup product's DPP |
| **AI** | `POST` | `/api/ai/analyze-product` | Photo analysis & craft extraction |
| | `POST` | `/api/ai/voice-to-product` | Voice transcript form population |
| | `POST` | `/api/ai/enhance-image` | Photo lighting enhancement demo |
| **Pricing** | `POST` | `/api/pricing/calculate` | Transparent cost & margin engine |
| **Buyers** | `POST` | `/api/buyers` | Register buyer |
| | `GET` | `/api/buyers` | List buyer profiles |
| | `GET` | `/api/buyers/{buyer_id}` | Get buyer profile |
| | `POST` | `/api/buyers/match` | Match craft with commercial buyers |
| **Inquiries** | `POST` | `/api/inquiries` | Create direct order inquiry |
| | `GET` | `/api/inquiries` | List all inquiries |
| | `PATCH` | `/api/inquiries/{inquiry_id}` | Accept/Reject inquiry |
| **Passports** | `POST` | `/api/passports` | Issue Digital Product Passport |
| | `GET` | `/api/passports/{passport_id}` | Retrieve passport record |
| **Provenance**| `POST` | `/api/provenance/events` | Record event to ledger |
| | `GET` | `/api/provenance/{passport_id}` | Fetch event audit timeline |
| **Verify (QR)**| `GET` | `/api/verify/{passport_id}` | Public verification endpoint |
| **Admin** | `GET` | `/api/admin/dashboard` | Platform metrics & pending counts |
| | `GET` | `/api/admin/artisans/pending` | Artisan verification queue |
| | `POST` | `/api/admin/artisans/{id}/approve`| Approve artisan |
| | `GET` | `/api/admin/products/pending` | Product verification queue |
| | `POST` | `/api/admin/products/{id}/approve`| Approve product & issue passport |
| | `POST` | `/api/admin/products/{id}/request-changes` | Request craft revisions |
| | `GET` | `/api/admin/provenance` | Platform-wide audit logs |

---

## 7. Example API Requests

### 1. Smart Pricing Calculation
```bash
curl -X POST http://localhost:8000/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "material_cost": 450,
    "labour_cost": 600,
    "production_days": 3,
    "packaging_cost": 100,
    "market_demand": "medium",
    "category": "Bamboo Craft",
    "region": "Assam",
    "artisan_experience_years": 18
  }'
```
`category`, `region` and `artisan_experience_years` are optional but improve the ML
model's accuracy — omit them and it falls back to sensible defaults. The response
includes `model_used: true/false` and `model_type` so it's always visible whether the
number came from the trained model or the fallback formula.

**Retraining on new data:** run `python backend/ml/generate_pricing_dataset.py` then
`python backend/ml/train_pricing_model.py` to regenerate the seed dataset and retrain.
As real transactions accumulate, append them to `backend/data/pricing_dataset.csv`
(same columns) before retraining — that turns this from a seed dataset into a dataset
built from CRAFTORA's real usage.

### 2. Buyer Matching
```bash
curl -X POST http://localhost:8000/api/buyers/match \
  -H "Content-Type: application/json" \
  -d '{
    "craft_type": "Bamboo Craft",
    "category": "Bamboo Craft",
    "price": 1200,
    "intended_use": "Home decor and hospitality"
  }'
```

### 3. Public QR Verification
```bash
curl http://localhost:8000/api/verify/CRF-PAS-001284
```

---

## 8. How to Replace Demo Services with Production Integrations

### A. Replacing Demo AI with Google Gemini Vision
In `backend/services/ai_service.py`:
1. Install `google-generativeai`.
2. Configure API key: `genai.configure(api_key=os.getenv("GEMINI_API_KEY"))`.
3. In `analyze_product_image()`, pass the image bytes to `gemini-1.5-flash` with a structured prompt requesting JSON containing category, materials, and description.

### B. Replacing Prototype Ledger with Polygon Blockchain
In `backend/services/provenance_service.py`:
1. Install `web3.py`.
2. Connect to Polygon Amoy Testnet RPC using an Alchemy/Infura endpoint.
3. Deploy an ERC-721 or provenance tracking smart contract.
4. Replace `generate_hash()` with a smart contract method call `recordProvenanceEvent(passportId, eventType, timestamp)` that writes a real on-chain transaction.

---

## 9. Important Prototype Disclaimers

- **In-Memory Store**: Data is maintained in-memory for zero-friction setup without requiring external database engines (PostgreSQL/MongoDB). State resets upon server restart (the seed dataset is re-initialized).
- **Demo Multimodal AI**: AI cataloguing and lighting enhancements are realistic rule-based simulations clearly labeled as `ai_mode: "demo"`.
- **Prototype Provenance**: Cryptographic SHA-256 hashes simulate blockchain immutability for evaluation without incurring gas fees or testnet latency.
- **Physical Authenticity**: Provenance verification confirms reviewed digital registration and artisan credentials; it does not independently certify physical authenticity.
