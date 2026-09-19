"""
CRAFTORA Product Reviews Router.
Enforces strict purchase-based verification: buyers can only review products
they have legitimately purchased with a COMPLETED order status.
"""

import html
import re
import secrets
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, status, Header, Query

from ..models.review import ReviewCreate, ReviewResponse, ProductReviewsOverview
from ..models.order import OrderStatus
from ..data.demo_data import REVIEWS, ORDERS, PRODUCTS, USERS, _LOCK, save_storage

router = APIRouter(tags=["Reviews"])

def _get_auth_user(authorization: Optional[str]) -> Optional[Dict[str, Any]]:
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    return next((u for u in USERS.values() if u.get("auth_token") == token), None)

def _sanitize_text(text: str) -> str:
    """Removes any script tags and escapes HTML entities for safety."""
    cleaned = re.sub(r"<script.*?>.*?</script>", "", text, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r"<.*?>", "", cleaned)
    return html.escape(cleaned.strip())


@router.get("/api/products/{product_id}/reviews/eligibility", summary="Check Buyer Review Eligibility")
def check_review_eligibility(
    product_id: str,
    buyer_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
):
    with _LOCK:
        user = _get_auth_user(authorization)
        target_buyer = buyer_id or (user.get("uid") if user else None)

        if not target_buyer:
            return {
                "canReview": False,
                "reason": "UNAUTHORIZED",
                "message": "Please sign in as a buyer to review this product."
            }

        # Check if buyer has a COMPLETED order for this product
        completed_order = next(
            (o for o in ORDERS.values()
             if o.get("product_id") == product_id and
                o.get("buyer_id") == target_buyer and
                o.get("status") == OrderStatus.COMPLETED.value),
            None
        )

        if not completed_order:
            return {
                "canReview": False,
                "reason": "PRODUCT_NOT_PURCHASED",
                "message": "You can only review products you have purchased and received."
            }

        # Check if buyer already reviewed this product
        existing_review = next(
            (r for r in REVIEWS.values()
             if r.get("product_id") == product_id and r.get("buyer_id") == target_buyer),
            None
        )

        if existing_review:
            return {
                "canReview": False,
                "reason": "ALREADY_REVIEWED",
                "message": "You have already reviewed this product."
            }

        return {
            "canReview": True,
            "order_id": completed_order.get("order_id"),
            "buyer_id": target_buyer,
            "message": "Verified purchaser. You are eligible to review this craft."
        }


@router.get("/api/products/{product_id}/reviews", response_model=ProductReviewsOverview, summary="Get Product Reviews")
def get_product_reviews(product_id: str):
    with _LOCK:
        prod_reviews = [
            ReviewResponse(**r) for r in REVIEWS.values()
            if r.get("product_id") == product_id
        ]

        if not prod_reviews:
            return ProductReviewsOverview(
                product_id=product_id,
                average_rating=0.0,
                total_reviews=0,
                reviews=[]
            )

        total = len(prod_reviews)
        avg = round(sum(r.rating for r in prod_reviews) / total, 1)

        return ProductReviewsOverview(
            product_id=product_id,
            average_rating=avg,
            total_reviews=total,
            reviews=sorted(prod_reviews, key=lambda x: x.created_at, reverse=True)
        )


@router.post("/api/products/{product_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED, summary="Submit Purchase-Verified Review")
def create_product_review(
    product_id: str,
    review_in: ReviewCreate,
    authorization: Optional[str] = Header(None)
):
    with _LOCK:
        user = _get_auth_user(authorization)
        buyer_id = review_in.buyer_id or (user.get("uid") if user else None)
        buyer_name = review_in.buyer_name or (user.get("name") if user else "Verified Buyer")

        if not buyer_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"success": False, "code": "UNAUTHORIZED", "message": "Sign in as a verified buyer to submit a review."}
            )

        # 1. Verify Product Exists
        product = PRODUCTS.get(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "code": "PRODUCT_NOT_FOUND", "message": f"Product '{product_id}' not found."}
            )

        # 2. Strict Backend Purchase Verification: Must have COMPLETED order
        valid_order = next(
            (o for o in ORDERS.values()
             if o.get("product_id") == product_id and
                o.get("buyer_id") == buyer_id and
                o.get("status") == OrderStatus.COMPLETED.value),
            None
        )

        if not valid_order:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "code": "REVIEW_NOT_ALLOWED",
                    "reason": "PRODUCT_NOT_PURCHASED",
                    "message": "Only buyers with a completed purchase of this product are permitted to submit a review."
                }
            )

        # 3. Prevent duplicate review
        existing = next(
            (r for r in REVIEWS.values()
             if r.get("product_id") == product_id and r.get("buyer_id") == buyer_id),
            None
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "code": "ALREADY_REVIEWED",
                    "message": "You have already reviewed this product purchase."
                }
            )

        # 4. Rating and Comment Sanitization
        if not (1 <= review_in.rating <= 5):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "code": "INVALID_RATING", "message": "Rating must be between 1 and 5."}
            )

        clean_comment = _sanitize_text(review_in.comment)
        if len(clean_comment) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "code": "INVALID_COMMENT", "message": "Review comment must be at least 3 characters."}
            )

        review_id = f"REV-{secrets.token_hex(4).upper()}"
        now_str = datetime.now().strftime("%d %b %Y")

        new_review = {
            "review_id": review_id,
            "product_id": product_id,
            "buyer_id": buyer_id,
            "buyer_name": buyer_name,
            "order_id": valid_order.get("order_id"),
            "rating": review_in.rating,
            "comment": clean_comment,
            "created_at": now_str,
            "verified_purchase": True
        }

        REVIEWS[review_id] = new_review

        # Dynamically recalculate product average rating
        matching_reviews = [r for r in REVIEWS.values() if r.get("product_id") == product_id]
        if matching_reviews:
            new_avg = round(sum(r["rating"] for r in matching_reviews) / len(matching_reviews), 1)
            product["rating"] = new_avg
            product["ratingCount"] = len(matching_reviews)

        save_storage()
        return ReviewResponse(**new_review)
