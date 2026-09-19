from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from ..models.product import ProductCreate, ProductUpdate, ProductResponse, CostBreakdown, BlockchainRecord
from ..models.passport import PassportResponse
from ..models.common import ProductStatus
from ..data.demo_data import PRODUCTS, ARTISANS, PASSPORTS, PROVENANCE_EVENTS, _LOCK, save_storage
from ..services.matching_service import MatchingService
from ..services.passport_service import PassportService
from ..services.provenance_service import ProvenanceService

router = APIRouter(prefix="/api/products", tags=["Products"])

def _hydrate_product_response(prod_dict: dict) -> ProductResponse:
    art_id = prod_dict.get("artisan_id", "")
    art = ARTISANS.get(art_id, {})
    
    # Enrich with artisan metadata
    enriched = dict(prod_dict)
    enriched["artisanName"] = art.get("name", "Master Artisan")
    enriched["artisanLocation"] = art.get("location", "India")
    enriched["artisanPhoto"] = art.get("photo_url", "assets/artisan_ramesh.png")
    
    # Check if a passport exists
    for pid, pass_data in PASSPORTS.items():
        if pass_data.get("product_id") == prod_dict.get("product_id"):
            enriched["passportAvailable"] = True
            enriched["passport"] = pass_data
            enriched["provenance_hash"] = pass_data.get("provenance_hash")
            evts = PROVENANCE_EVENTS.get(pid, [])
            enriched["blockchainRecord"] = BlockchainRecord(
                network="Polygon Testnet Demo",
                record_type="Prototype Blockchain Record",
                status="Recorded",
                recorded_at=pass_data.get("registration_date", "18 Sep 2026"),
                is_demo=True,
                events=evts
            )
            break

    return ProductResponse(**enriched)

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, summary="Create New Craft Product")
def create_product(product_in: ProductCreate):
    with _LOCK:
        # 1. Validate artisan exists
        if product_in.artisan_id not in ARTISANS:
            if product_in.artisan_id and product_in.artisan_id.startswith("CRF-ART-"):
                ARTISANS[product_in.artisan_id] = {
                    "artisan_id": product_in.artisan_id,
                    "name": "Master Artisan",
                    "craft_category": product_in.category or "Handicrafts",
                    "craft_specialty": product_in.craft_type or product_in.category or "Handicrafts",
                    "location": "India",
                    "phone": "",
                    "created_at": datetime.now().strftime("%d %b %Y"),
                    "status": "APPROVED",
                    "verified": True
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid artisan_id '{product_in.artisan_id}'. Artisan must be registered first."
                )

        # 2. Determine Product ID (Collision-Resistant Globally Unique Identifier)
        product_id = product_in.product_id
        if not product_id:
            import secrets
            product_id = f"CRAFTORA-2026-{secrets.token_hex(4).upper()}"

        if product_id in PRODUCTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with ID '{product_id}' already exists."
            )

        now_str = datetime.now().strftime("%d %b %Y")
        prod_dict = product_in.model_dump()
        prod_dict["product_id"] = product_id
        prod_dict["created_at"] = now_str
        prod_dict["updated_at"] = now_str

        # Auto-compute buyer matches if empty
        if not prod_dict.get("buyer_matches"):
            match_res = MatchingService.match_buyers(
                product_id=product_id,
                craft_type=prod_dict.get("craft_type"),
                category=prod_dict.get("category"),
                price=prod_dict.get("price", 0.0)
            )
            prod_dict["buyer_matches"] = match_res.get("matches", [])

        PRODUCTS[product_id] = prod_dict

    # Create prototype passport record
    PassportService.create_passport_for_product(
        product_id=product_id,
        verification_status="PENDING"
    )

    save_storage()

    with _LOCK:
        return _hydrate_product_response(PRODUCTS[product_id])

@router.get("", response_model=List[ProductResponse], summary="List All Craft Products")
def list_products(
    category: Optional[str] = None,
    artisan_id: Optional[str] = None,
    status_filter: Optional[ProductStatus] = None
):
    with _LOCK:
        results = []
        for p in PRODUCTS.values():
            if category and category.lower() not in p.get("category", "").lower():
                continue
            if artisan_id and p.get("artisan_id") != artisan_id:
                continue
            if status_filter and p.get("status") != status_filter.value:
                continue
            results.append(_hydrate_product_response(p))
        return results

@router.get("/{product_id}", response_model=ProductResponse, summary="Get Product by ID")
def get_product(product_id: str):
    with _LOCK:
        p = PRODUCTS.get(product_id)
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product '{product_id}' not found.")
        return _hydrate_product_response(p)

@router.put("/{product_id}", response_model=ProductResponse, summary="Update Product")
def update_product(product_id: str, product_in: ProductUpdate):
    with _LOCK:
        p = PRODUCTS.get(product_id)
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product '{product_id}' not found.")
        
        updates = product_in.model_dump(exclude_unset=True)
        for key, val in updates.items():
            if val is not None:
                if key == "status" and isinstance(val, ProductStatus):
                    p[key] = val.value
                else:
                    p[key] = val
        
        p["updated_at"] = datetime.now().strftime("%d %b %Y")
        save_storage()
        return _hydrate_product_response(p)

@router.delete("/{product_id}", status_code=status.HTTP_200_OK, summary="Delete Product")
def delete_product(product_id: str):
    with _LOCK:
        if product_id not in PRODUCTS:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product '{product_id}' not found.")
        del PRODUCTS[product_id]
        save_storage()
        return {"success": True, "message": f"Product '{product_id}' deleted successfully."}

@router.get("/{product_id}/passport", response_model=PassportResponse, summary="Get Product's Digital Product Passport")
def get_product_passport(product_id: str):
    passport = PassportService.get_by_product_id(product_id)
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No Digital Product Passport found for product '{product_id}'."
        )
    return PassportResponse(**passport)
