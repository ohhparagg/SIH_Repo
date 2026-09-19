"""
CRAFTORA Orders Router.
Handles real product purchases, order status tracking, and purchase verification.
"""

import secrets
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Header, Query

from ..models.order import OrderCreate, OrderResponse, OrderStatus
from ..data.demo_data import ORDERS, PRODUCTS, USERS, BUYERS, _LOCK, save_storage

router = APIRouter(prefix="/api/orders", tags=["Orders"])

def _get_auth_user(authorization: Optional[str]) -> Optional[Dict[str, Any]]:
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    return next((u for u in USERS.values() if u.get("auth_token") == token), None)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED, summary="Create/Purchase Craft Product")
def create_order(
    order_in: OrderCreate,
    authorization: Optional[str] = Header(None)
):
    with _LOCK:
        user = _get_auth_user(authorization)
        
        # Verify product exists
        product = PRODUCTS.get(order_in.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "code": "PRODUCT_NOT_FOUND", "message": f"Product '{order_in.product_id}' not found."}
            )

        buyer_id = order_in.buyer_id or (user.get("uid") if user else "CRF-BUY-001001")
        buyer_name = order_in.buyer_name or (user.get("name") if user else "Arjun Sharma")

        # Create collision-resistant order ID
        order_id = f"ORD-2026-{secrets.token_hex(4).upper()}"
        now_str = datetime.now().strftime("%d %b %Y %H:%M")

        new_order = {
            "order_id": order_id,
            "buyer_id": buyer_id,
            "buyer_name": buyer_name,
            "product_id": order_in.product_id,
            "amount": float(order_in.amount),
            "status": OrderStatus.COMPLETED.value,
            "created_at": now_str,
            "completed_at": now_str
        }

        ORDERS[order_id] = new_order
        save_storage()
        return OrderResponse(**new_order)


@router.get("", response_model=List[OrderResponse], summary="List Orders")
def list_orders(
    buyer_id: Optional[str] = Query(None),
    product_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
):
    with _LOCK:
        user = _get_auth_user(authorization)
        target_buyer = buyer_id or (user.get("uid") if user else None)

        results = []
        for o in ORDERS.values():
            if target_buyer and o.get("buyer_id") != target_buyer:
                continue
            if product_id and o.get("product_id") != product_id:
                continue
            results.append(OrderResponse(**o))
        return results


@router.get("/{order_id}", response_model=OrderResponse, summary="Get Order by ID")
def get_order(order_id: str):
    with _LOCK:
        order = ORDERS.get(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "code": "ORDER_NOT_FOUND", "message": f"Order '{order_id}' not found."}
            )
        return OrderResponse(**order)
