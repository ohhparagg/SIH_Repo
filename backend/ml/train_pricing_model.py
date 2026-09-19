"""
CRAFTORA — Trains the Smart Pricing model.

Replaces the old fixed-multiplier formula (total_cost * 1.25/1.45/1.55)
with a RandomForestRegressor trained on backend/data/pricing_dataset.csv,
so the "AI Indicative Price Recommendation" is an actual learned model
rather than a hardcoded lookup table.

Run:
    python backend/ml/train_pricing_model.py

Outputs:
    backend/ml/artifacts/pricing_model.joblib   (trained pipeline)
    backend/ml/artifacts/metrics.json           (held-out evaluation)
"""

import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

HERE = os.path.dirname(__file__)
DATA_PATH = os.path.join(HERE, "..", "data", "pricing_dataset.csv")
ARTIFACT_DIR = os.path.join(HERE, "artifacts")
MODEL_PATH = os.path.join(ARTIFACT_DIR, "pricing_model.joblib")
METRICS_PATH = os.path.join(ARTIFACT_DIR, "metrics.json")

NUMERIC_FEATURES = [
    "material_cost", "labour_cost", "production_days",
    "packaging_cost", "artisan_experience_years",
]
CATEGORICAL_FEATURES = ["category", "region", "market_demand"]
TARGET = "price"


def main():
    df = pd.read_csv(os.path.abspath(DATA_PATH))
    print(f"Loaded {len(df)} rows from {DATA_PATH}")

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ],
        remainder="passthrough",  # numeric features pass through unchanged
    )

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=12,
        min_samples_leaf=3,
        random_state=42,
        n_jobs=-1,
    )

    pipeline = Pipeline(steps=[
        ("preprocess", preprocessor),
        ("model", model),
    ])

    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    mape = mean_absolute_percentage_error(y_test, preds)
    r2 = r2_score(y_test, preds)

    # Also compare against the OLD fixed-multiplier formula on the same
    # test set, so the improvement is visible/provable to judges.
    def old_formula(row):
        total_cost = row["material_cost"] + row["labour_cost"] + row["packaging_cost"]
        mult = {"low": 1.25, "medium": 1.45, "high": 1.55}.get(row["market_demand"], 1.45)
        return total_cost * mult

    old_preds = X_test.apply(old_formula, axis=1)
    old_mae = mean_absolute_error(y_test, old_preds)
    old_mape = mean_absolute_percentage_error(y_test, old_preds)

    metrics = {
        "n_rows_total": len(df),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "random_forest": {
            "mae_inr": round(float(mae), 2),
            "mape_pct": round(float(mape) * 100, 2),
            "r2": round(float(r2), 4),
        },
        "old_fixed_multiplier_formula": {
            "mae_inr": round(float(old_mae), 2),
            "mape_pct": round(float(old_mape) * 100, 2),
        },
    }

    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    joblib.dump(pipeline, os.path.abspath(MODEL_PATH))
    with open(os.path.abspath(METRICS_PATH), "w") as f:
        json.dump(metrics, f, indent=2)

    print(json.dumps(metrics, indent=2))
    print(f"\nSaved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
