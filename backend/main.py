"""
CRAFTORA Backend Application Entry Point.
FastAPI service supporting AI cataloguing, smart pricing, buyer matching,
digital product passports, provenance records, and administrative verification.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from .routers import (
    health,
    auth,
    artisans,
    products,
    ai,
    pricing,
    buyers,
    orders,
    reviews,
    inquiries,
    passports,
    provenance,
    verification,
    admin
)

app = FastAPI(
    title="CRAFTORA API — AI-Powered Digital Business Platform for Artisans",
    description=(
        "Backend services for Smart India Hackathon (SIH 2026) Problem Statement SIH26090: "
        "AI-Driven Market Linkage and Smart Cataloging Mobile Application for Marginalized Artisans.\n\n"
        "**Core Flows**: CREATE → PRICE → CONNECT → VERIFY\n\n"
        "- **Artisan Hub**: Profile creation, AI cataloguing, voice assistant, and fair pricing engine.\n"
        "- **Buyer Discovery**: Regional craft catalog, rule-based matching, and direct wholesale inquiries.\n"
        "- **Governance & Trust**: Digital Product Passports, prototype provenance ledger, and admin verification."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ── CORS CONFIGURATION ────────────────────────────────────────────────
# Supports existing frontend Node server running on port 3456 as well as local clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3456",
        "http://127.0.0.1:3456",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REGISTER ROUTERS ──────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(artisans.router)
app.include_router(products.router)
app.include_router(ai.router)
app.include_router(pricing.router)
app.include_router(buyers.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(inquiries.router)
app.include_router(passports.router)
app.include_router(provenance.router)
app.include_router(verification.router)
app.include_router(admin.router)

# Compatibility alias for direct /api/analyze-product callers
app.add_api_route("/api/analyze-product", ai.analyze_product, methods=["POST"], include_in_schema=False)

@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirect root to interactive Swagger UI documentation."""
    return RedirectResponse(url="/docs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
