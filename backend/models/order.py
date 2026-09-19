"""
CRAFTORA Order & Purchase Models.
Tracks verified buyer orders required for review eligibility.
"""

from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field


class OrderStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class OrderCreate(BaseModel):
    product_id: str
    buyer_id: Optional[str] = None
    buyer_name: Optional[str] = None
    amount: float = Field(..., gt=0)
    shipping_address: Optional[str] = "India"


class OrderResponse(BaseModel):
    order_id: str
    buyer_id: str
    buyer_name: str
    product_id: str
    amount: float
    status: OrderStatus = OrderStatus.COMPLETED
    created_at: str
    completed_at: Optional[str] = None
