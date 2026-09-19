"""
CRAFTORA Digital Product Passport (DPP) Service.
Generates globally unique collision-resistant Product Passports with canonical
SHA-256 cryptographic provenance hashing and verifiable model lineage.
"""

import json
import hashlib
import secrets
from datetime import datetime
from typing import Optional, Dict, Any, List
from ..data.demo_data import PASSPORTS, PRODUCTS, ARTISANS, _LOCK, save_storage
from .provenance_service import ProvenanceService

MODEL_VERSIONS = {
    "detector": "yolo11n-craft-v1",
    "classifier": "efficientnet-craft-v1",
    "pricing": "xgboost-v1"
}


class PassportService:
    @classmethod
    def compute_provenance_hash(cls, product: Dict[str, Any], product_id: str) -> Dict[str, Any]:
        """
        Computes deterministic SHA-256 hash over canonical product data.
        Identical inputs always yield the identical hash.
        """
        materials = product.get("materials", [])
        if isinstance(materials, str):
            materials = [m.strip() for m in materials.split(",") if m.strip()]
        elif not isinstance(materials, list):
            materials = []

        canonical_data = {
            "artisan_id": str(product.get("artisan_id", "")),
            "category": str(product.get("category", "")),
            "created_at": str(product.get("created_at", "")),
            "materials": sorted(materials),
            "model_versions": MODEL_VERSIONS,
            "price": float(product.get("price", 0.0)),
            "product_id": str(product_id),
            "title": str(product.get("name", product.get("title", "")))
        }

        canonical_json = json.dumps(canonical_data, sort_keys=True, separators=(',', ':'))
        data_hash = hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()
        passport_id = f"DPP-CRAFTORA-{data_hash[:12].upper()}"

        return {
            "passport_id": passport_id,
            "passportId": passport_id,
            "data_hash": data_hash,
            "dataHash": data_hash,
            "hash_algorithm": "SHA-256",
            "hashAlgorithm": "SHA-256",
            "canonical_data": canonical_data,
            "canonicalData": canonical_data,
            "model_versions": MODEL_VERSIONS,
            "modelVersions": MODEL_VERSIONS
        }

    @classmethod
    def create_passport_for_product(
        cls,
        product_id: str,
        verification_status: str = "PENDING"
    ) -> Dict[str, Any]:
        with _LOCK:
            product = PRODUCTS.get(product_id)
            if not product:
                raise ValueError(f"Product {product_id} not found")

            artisan = ARTISANS.get(product.get("artisan_id", ""))
            artisan_name = artisan.get("name", "Unknown Artisan") if artisan else "Artisan"
            artisan_location = artisan.get("location", "India") if artisan else "India"

            # Compute canonical SHA-256 provenance hash
            prov_meta = cls.compute_provenance_hash(product, product_id)
            passport_id = prov_meta["passport_id"]
            reg_date = datetime.now().strftime("%d %b %Y")

            # Check if passport already exists
            if passport_id in PASSPORTS:
                PASSPORTS[passport_id]["verification_status"] = verification_status
                return PASSPORTS[passport_id]

            passport = {
                "passport_id": passport_id,
                "passportId": passport_id,
                "product_id": product_id,
                "productId": product_id,
                "artisan_id": product.get("artisan_id"),
                "artisanId": product.get("artisan_id"),
                "product_name": product.get("name", product.get("title", "Handicraft")),
                "craft": product.get("category"),
                "craft_type": product.get("craft_type", product.get("category")),
                "origin": artisan_location,
                "materials": product.get("materials", []),
                "production_time": product.get("production_time", f"{product.get('production_days', 2)} Days"),
                "registration_date": reg_date,
                "createdAt": reg_date,
                "data_hash": prov_meta["data_hash"],
                "dataHash": prov_meta["data_hash"],
                "provenance_hash": prov_meta["data_hash"],
                "provenanceHash": prov_meta["data_hash"],
                "hash_algorithm": "SHA-256",
                "hashAlgorithm": "SHA-256",
                "model_versions": MODEL_VERSIONS,
                "modelVersions": MODEL_VERSIONS,
                "canonical_data": prov_meta["canonical_data"],
                "canonicalData": prov_meta["canonical_data"],
                "verification_url": f"http://localhost:8000/api/products/{product_id}/passport",
                "provenance_layer": "Cryptographic Provenance Hash (SHA-256)",
                "future_blockchain_record": {
                    "status": "Interface Ready",
                    "anchor_network": "Polygon / EVM Testnet Architecture",
                    "note": "Current: Unique Product ID + Cryptographic Provenance Hash. Future: On-chain transaction anchor."
                }
            }
            PASSPORTS[passport_id] = passport

            # Link passportId into product
            product["passport_id"] = passport_id
            product["passportId"] = passport_id
            product["dataHash"] = prov_meta["data_hash"]

        save_storage()

        # Record initial provenance events outside the dict lock
        ProvenanceService.record_event(
            passport_id=passport_id,
            event_type="PRODUCT_REGISTERED",
            description=f"Digital passport created for {product.get('name')} by {artisan_name} with SHA-256: {prov_meta['data_hash'][:16]}..."
        )
        ProvenanceService.record_event(
            passport_id=passport_id,
            event_type="ARTISAN_LINKED",
            description=f"Authentic craft origin recorded at {artisan_location}"
        )

        if verification_status == "VERIFIED":
            ProvenanceService.record_event(
                passport_id=passport_id,
                event_type="ADMIN_VERIFIED",
                description="Digital Product Passport approved by CRAFTORA Administrator"
            )

        return passport

    @classmethod
    def get_passport(cls, passport_id: str) -> Optional[Dict[str, Any]]:
        with _LOCK:
            passport = PASSPORTS.get(passport_id)
            if not passport:
                return None
            res = dict(passport)
        res["provenance"] = ProvenanceService.get_events(passport_id)
        return res

    @classmethod
    def get_by_product_id(cls, product_id: str) -> Optional[Dict[str, Any]]:
        with _LOCK:
            target_pid = None
            for pid, p in PASSPORTS.items():
                if p.get("product_id") == product_id or p.get("productId") == product_id:
                    target_pid = pid
                    break
        if target_pid:
            return cls.get_passport(target_pid)
        return None

    @classmethod
    def update_status(cls, passport_id: str, new_status: str, note: Optional[str] = None):
        with _LOCK:
            passport = PASSPORTS.get(passport_id)
            if not passport:
                return None
            passport["verification_status"] = new_status
            passport["updated_at"] = datetime.now().strftime("%d %b %Y %H:%M")
        save_storage()

        ProvenanceService.record_event(
            passport_id=passport_id,
            event_type=f"STATUS_{new_status}",
            description=note or f"Passport status updated to {new_status}"
        )
        return passport
