from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from typing import Optional
from ..services.pricing_service import PricingService

router = APIRouter(prefix="/api/pricing", tags=["Smart Pricing"])

class PricingCalculationRequest(BaseModel):
    material_cost: Optional[float] = Field(250.0, ge=0.0, description="Raw material costs in INR")
    labour_cost: Optional[float] = Field(400.0, ge=0.0, description="Artisan wages in INR")
    production_days: Optional[int] = Field(1, ge=1, le=365, description="Days to produce this craft")
    production_time_days: Optional[int] = Field(None, ge=1, le=365)
    packaging_cost: Optional[float] = Field(0.0, ge=0.0, description="Packaging materials cost in INR")
    market_demand: Optional[str] = Field("medium", description="'low', 'medium', or 'high'")
    category: Optional[str] = Field(
        None,
        description="Craft category, e.g. 'Bamboo Craft', 'Madhubani Painting', 'Blue Pottery', 'Phulkari'. "
                    "Improves model accuracy; falls back to a sensible default if omitted."
    )
    materials: Optional[list] = Field(None, description="Optional materials list")
    region: Optional[str] = Field(
        None, description="Artisan's state/region. Improves model accuracy; inferred from category if omitted."
    )
    artisan_experience_years: Optional[int] = Field(
        None, ge=0, le=80, description="Years of experience in this craft. Improves model accuracy."
    )
    complexity: Optional[str] = Field(None, description="Craft complexity")
    item_weight_kg: Optional[float] = Field(None, description="Craft weight")

@router.post("/calculate", summary="Calculate Fair Cost Itemization & ML Indicative Selling Price")
def calculate_pricing(request: PricingCalculationRequest):
    """
    Computes total cost itemization and produces an AI Indicative Recommended
    Selling Price using the XGBoost Regressor trained on CRAFTORA's authentic
    pricing dataset (backend/data/pricing_dataset.csv).
    """
    prod_days = request.production_days or request.production_time_days or 1
    mat_cost = request.material_cost if request.material_cost is not None else 250.0
    lab_cost = request.labour_cost if request.labour_cost is not None else 400.0

    return PricingService.calculate_pricing(
        material_cost=mat_cost,
        labour_cost=lab_cost,
        production_days=prod_days,
        packaging_cost=request.packaging_cost or 0.0,
        market_demand=request.market_demand or "medium",
        category=request.category,
        region=request.region,
        artisan_experience_years=request.artisan_experience_years,
    )
