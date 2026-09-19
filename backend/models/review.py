"""
CRAFTORA Product Review Models.
Purchase-gated reviews submitted only by verified buyers who completed an order.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    product_id: Optional[str] = None
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    comment: str = Field(..., min_length=3, max_length=1000, description="Customer review text")
    buyer_id: Optional[str] = None
    buyer_name: Optional[str] = None
    order_id: Optional[str] = None


class ReviewResponse(BaseModel):
    review_id: str
    product_id: str
    buyer_id: str
    buyer_name: str
    order_id: str
    rating: int
    comment: str
    created_at: str
    verified_purchase: bool = True


class ProductReviewsOverview(BaseModel):
    product_id: str
    average_rating: float
    total_reviews: int
    reviews: List[ReviewResponse]
