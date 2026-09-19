from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from .common import ProductStatus

class CostBreakdown(BaseModel):
    material_cost: float = Field(0.0, ge=0.0, description="Cost of raw materials in INR")
    labour_cost: float = Field(0.0, ge=0.0, description="Artisan labour wages in INR")
    production_days: int = Field(1, ge=1, description="Days to craft this item")
    packaging_cost: float = Field(0.0, ge=0.0, description="Protective packaging cost in INR")
    total_estimated_cost: float = Field(0.0, ge=0.0, description="Sum of raw materials + labour + packaging")

    # Frontend camelCase compatibility
    materialCost: Optional[float] = None
    labourCost: Optional[float] = None
    productionTimeDays: Optional[int] = None
    packagingCost: Optional[float] = None
    totalEstimatedCost: Optional[float] = None

    def model_post_init(self, __context):
        if self.materialCost is None:
            self.materialCost = self.material_cost
        if self.labourCost is None:
            self.labourCost = self.labour_cost
        if self.productionTimeDays is None:
            self.productionTimeDays = self.production_days
        if self.packagingCost is None:
            self.packagingCost = self.packaging_cost
        if self.totalEstimatedCost is None:
            self.totalEstimatedCost = self.total_estimated_cost or (self.material_cost + self.labour_cost + self.packaging_cost)

class AIInsight(BaseModel):
    market_demand: str = "High"
    similar_price_range: Dict[str, float] = Field(default_factory=lambda: {"min": 500, "max": 800})
    indicative_price_range: Dict[str, float] = Field(default_factory=lambda: {"min": 600, "max": 750})
    suggested_price: float = 680.0
    confidence_score: Optional[float] = 0.92
    label: str = "AI Indicative Price Recommendation"

    # Frontend compatibility
    marketDemand: Optional[str] = None
    similarPriceRange: Optional[Dict[str, float]] = None
    indicativePriceRange: Optional[Dict[str, float]] = None
    suggestedPrice: Optional[float] = None
    confidenceScore: Optional[float] = None

    def model_post_init(self, __context):
        if self.marketDemand is None:
            self.marketDemand = self.market_demand
        if self.similarPriceRange is None:
            self.similarPriceRange = self.similar_price_range
        if self.indicativePriceRange is None:
            self.indicativePriceRange = self.indicative_price_range
        if self.suggestedPrice is None:
            self.suggestedPrice = self.suggested_price
        if self.confidenceScore is None:
            self.confidenceScore = self.confidence_score

class BuyerMatch(BaseModel):
    id: str
    buyer_id: Optional[str] = None
    buyer_name: Optional[str] = None
    buyer_type: Optional[str] = None
    buyer_category: str
    match_percentage: int
    match_score: Optional[int] = None
    looking_for: str
    requirement: str
    reason: Optional[str] = None

    # Frontend compatibility
    buyerCategory: Optional[str] = None
    matchPercentage: Optional[int] = None
    lookingFor: Optional[str] = None

    def model_post_init(self, __context):
        if not self.buyerCategory:
            self.buyerCategory = self.buyer_category
        if self.matchPercentage is None:
            self.matchPercentage = self.match_percentage
        if not self.lookingFor:
            self.lookingFor = self.looking_for
        if self.match_score is None:
            self.match_score = self.match_percentage

class BlockchainRecord(BaseModel):
    network: str = "Polygon Testnet Demo"
    record_type: str = "Prototype Blockchain Record"
    status: str = "Recorded"
    recorded_at: str = "18 Sep 2026"
    is_demo: bool = True
    events: List[Dict[str, Any]] = Field(default_factory=list)

    # Frontend compatibility
    recordType: Optional[str] = None
    recordedAt: Optional[str] = None
    isDemo: Optional[bool] = None

    def model_post_init(self, __context):
        if not self.recordType:
            self.recordType = self.record_type
        if not self.recordedAt:
            self.recordedAt = self.recorded_at
        if self.isDemo is None:
            self.isDemo = self.is_demo

class ProductBase(BaseModel):
    artisan_id: str = Field(..., description="ID of creator artisan")
    name: str = Field(..., min_length=2, max_length=150, description="Product title")
    category: str = Field(..., description="Craft category e.g. Bamboo Craft")
    craft_type: Optional[str] = Field(None, description="Specific technique")
    description: str = Field("", description="Craft narrative and item details")
    materials: List[str] = Field(default_factory=list, description="Raw materials used")
    tags: List[str] = Field(default_factory=list, description="Descriptive tags")
    production_time: Optional[str] = Field("2 Days", description="Production time text")
    production_days: int = Field(1, ge=1, description="Production days integer")
    image: Optional[str] = Field("assets/bamboo_basket.png", description="Image URL or path")
    enhanced_image: Optional[str] = None
    price: float = Field(0.0, ge=0.0, description="Final selling price in INR")
    cost_breakdown: Optional[CostBreakdown] = None
    ai_insight: Optional[AIInsight] = None
    buyer_matches: List[BuyerMatch] = Field(default_factory=list)
    status: ProductStatus = ProductStatus.PENDING_VERIFICATION

class ProductCreate(BaseModel):
    artisan_id: Optional[str] = None
    artisanId: Optional[str] = None
    name: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = "Handicrafts"
    craft_type: Optional[str] = None
    description: str = ""
    materials: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    production_time: Optional[str] = "2 Days"
    production_days: int = Field(1, ge=1)
    productionTimeDays: Optional[int] = None
    image: Optional[str] = "assets/bamboo_basket.png"
    imageUrl: Optional[str] = None
    enhanced_image: Optional[str] = None
    price: float = Field(0.0, ge=0.0)
    cost_breakdown: Optional[CostBreakdown] = None
    ai_insight: Optional[AIInsight] = None
    buyer_matches: List[BuyerMatch] = Field(default_factory=list)
    status: ProductStatus = ProductStatus.PENDING_VERIFICATION
    product_id: Optional[str] = None
    id: Optional[str] = None

    def model_post_init(self, __context):
        if not self.artisan_id and self.artisanId:
            self.artisan_id = self.artisanId
        elif not self.artisan_id:
            self.artisan_id = "CRF-ART-001284"
        if not self.name and self.title:
            self.name = self.title
        elif not self.name:
            self.name = "Handcrafted Artisan Item"
        if not self.product_id and self.id:
            self.product_id = self.id
        if not self.image and self.imageUrl:
            self.image = self.imageUrl
        if self.productionTimeDays is not None:
            self.production_days = self.productionTimeDays

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    craft_type: Optional[str] = None
    description: Optional[str] = None
    materials: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    production_time: Optional[str] = None
    production_days: Optional[int] = None
    image: Optional[str] = None
    enhanced_image: Optional[str] = None
    price: Optional[float] = None
    cost_breakdown: Optional[CostBreakdown] = None
    ai_insight: Optional[AIInsight] = None
    buyer_matches: Optional[List[BuyerMatch]] = None
    status: Optional[ProductStatus] = None
    review_note: Optional[str] = None

class ProductResponse(ProductBase):
    product_id: str
    created_at: str
    updated_at: str
    review_note: Optional[str] = None

    # Frontend compatibility mirrors
    id: Optional[str] = None
    title: Optional[str] = None
    artisanId: Optional[str] = None
    artisanName: Optional[str] = None
    artisanLocation: Optional[str] = None
    artisanPhoto: Optional[str] = None
    imageUrl: Optional[str] = None
    productionTimeDays: Optional[int] = None
    passportAvailable: bool = True
    passport: Optional[Dict[str, Any]] = None
    provenance_hash: Optional[str] = None
    blockchainRecord: Optional[BlockchainRecord] = None
    costBreakdown: Optional[CostBreakdown] = None
    aiInsight: Optional[AIInsight] = None
    buyerMatches: Optional[List[BuyerMatch]] = None

    def model_post_init(self, __context):
        if not self.id:
            self.id = self.product_id
        if not self.title:
            self.title = self.name
        if not self.artisanId:
            self.artisanId = self.artisan_id
        if not self.imageUrl:
            self.imageUrl = self.image
        if self.productionTimeDays is None:
            self.productionTimeDays = self.production_days
        if self.costBreakdown is None:
            self.costBreakdown = self.cost_breakdown
        if self.aiInsight is None:
            self.aiInsight = self.ai_insight
        if self.buyerMatches is None:
            self.buyerMatches = self.buyer_matches
