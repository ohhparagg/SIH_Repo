"""
CRAFTORA — Train XGBoost Smart Pricing Model.
Trains a real XGBoost Regressor on authentic craft production data (pricing_dataset.csv).
Outputs:
    backend/ml/artifacts/xgboost_pricing_model.joblib
    backend/ml/artifacts/pricing_metrics.json
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, r2_score

HERE = os.path.dirname(__file__)
DATA_PATH = os.path.abspath(os.path.join(HERE, "..", "..", "data", "pricing_dataset.csv"))
ARTIFACT_DIR = os.path.abspath(os.path.join(HERE, "..", "artifacts"))
MODEL_PATH = os.path.join(ARTIFACT_DIR, "xgboost_pricing_model.joblib")
METRICS_PATH = os.path.join(ARTIFACT_DIR, "pricing_metrics.json")

NUMERIC_FEATURES = [
    "material_cost",
    "labour_cost",
    "production_days",
    "packaging_cost",
    "artisan_experience_years"
]

CATEGORICAL_FEATURES = [
    "category",
    "region",
    "market_demand"
]

TARGET = "price"


def train_xgboost_pricing():
    print("=======================================================")
    print("🚀 CRAFTORA XGBoost Pricing Model Training")
    print("=======================================================")

    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Pricing dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    print(f"✓ Loaded {len(df)} authentic craft pricing records from: {DATA_PATH}")

    # Verify required columns exist
    required_cols = NUMERIC_FEATURES + CATEGORICAL_FEATURES + [TARGET]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in dataset: {missing}")

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"✓ Split data: {len(X_train)} train samples, {len(X_test)} test samples")

    # Construct ColumnTransformer for one-hot encoding categories
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
        ],
        remainder="passthrough"
    )

    # Instantiate XGBoost Regressor
    xgb_model = XGBRegressor(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.06,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42
    )

    pipeline = Pipeline(steps=[
        ("preprocess", preprocessor),
        ("model", xgb_model)
    ])

    print("✓ Fitting XGBoost Regressor pipeline...")
    pipeline.fit(X_train, y_train)

    # Evaluate on held-out test split
    preds = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    mape = mean_absolute_percentage_error(y_test, preds)
    r2 = r2_score(y_test, preds)

    print(f"✓ Evaluation on held-out test set:")
    print(f"  • MAE:  ₹{mae:.2f}")
    print(f"  • MAPE: {mape * 100:.2f}%")
    print(f"  • R² Score: {r2:.4f}")

    # Save artifacts
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"✓ Saved trained XGBoost model to: {MODEL_PATH}")

    metrics = {
        "model_version": "xgboost-v1",
        "algorithm": "XGBRegressor",
        "n_samples": len(df),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "mae_inr": round(float(mae), 2),
        "mape_pct": round(float(mape) * 100, 2),
        "r2_score": round(float(r2), 4)
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"✓ Saved metrics report to: {METRICS_PATH}")
    print("=======================================================\n")
    return pipeline, metrics


if __name__ == "__main__":
    train_xgboost_pricing()
