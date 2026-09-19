"""
CRAFTORA — Pricing dataset generator.

WHY THIS EXISTS
----------------
CRAFTORA's live storage.json only contains 14 product records, and 11 of
those are identical rows produced by the automated test scripts
(test_craftora_flow.js / run_judge_tests.js) reusing the same 3-4 demo
products. That is not enough — and not diverse enough — to train a
meaningful pricing model (a model trained on 5 unique rows just
memorizes them).

This script builds a larger, structured seed dataset that is grounded in
CRAFTORA's own real categories, regions and artisans (pulled straight out
of backend/data/demo_data.py and js/data/mockData.js) rather than being
generic invented data. It encodes real domain knowledge about Indian
handicraft pricing (which categories are labour-intensive vs
material-intensive, how demand and artisan experience move price, mild
regional cost variation) as the generating function, then adds noise so
the model has to learn the *relationship*, not memorize rows.

HONESTY NOTE FOR THE TEAM: this is a seed/bootstrap dataset, not scraped
real sales data. It is a legitimate and common way to bootstrap a first
model (documented as such). For a stronger judge story, start logging
real (material_cost, labour_cost, production_days, packaging_cost,
category, market_demand, final_agreed_price) rows from real artisan
transactions as they happen, append them to
backend/data/pricing_training_log.csv, and re-run train_pricing_model.py
periodically — the more real rows accumulate, the more this becomes
genuinely "your own data" in the fullest sense.
"""

import csv
import random
import os

random.seed(42)

OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "pricing_dataset.csv")

# Grounded in CRAFTORA's real taxonomy (backend/data/demo_data.py, js/data/mockData.js)
CATEGORIES = {
    # name: (material_cost_range, labour_per_day_range, days_range, packaging_range, base_margin)
    "Bamboo Craft":        {"material": (100, 350),  "labour_per_day": (80, 150), "days": (1, 4),  "packaging": (20, 70),  "margin": (1.25, 1.55)},
    "Madhubani Painting":  {"material": (150, 500),  "labour_per_day": (90, 160), "days": (3, 10), "packaging": (30, 90),  "margin": (1.35, 1.70)},
    "Blue Pottery":        {"material": (200, 600),  "labour_per_day": (100, 170),"days": (3, 7),  "packaging": (40, 120), "margin": (1.30, 1.65)},
    "Phulkari":            {"material": (300, 900),  "labour_per_day": (110, 180),"days": (5, 15), "packaging": (40, 100), "margin": (1.40, 1.80)},
}

REGIONS = {
    # mild regional cost-of-living / market-access multiplier
    "Assam": 0.97,
    "Bihar": 0.95,
    "Rajasthan": 1.05,
    "Punjab": 1.03,
}
CATEGORY_REGION = {
    "Bamboo Craft": "Assam",
    "Madhubani Painting": "Bihar",
    "Blue Pottery": "Rajasthan",
    "Phulkari": "Punjab",
}

DEMAND_LEVELS = ["low", "medium", "high"]
DEMAND_BOOST = {"low": 0.92, "medium": 1.0, "high": 1.12}

N_PER_CATEGORY = 140  # ~560 rows total


def make_row(category):
    cfg = CATEGORIES[category]
    region = CATEGORY_REGION[category]
    region_mult = REGIONS[region]

    material_cost = round(random.uniform(*cfg["material"]), 2)
    days = random.randint(*cfg["days"])
    labour_per_day = random.uniform(*cfg["labour_per_day"])
    labour_cost = round(labour_per_day * days, 2)
    packaging_cost = round(random.uniform(*cfg["packaging"]), 2)

    artisan_experience_years = max(1, int(random.gauss(15, 7)))
    experience_premium = 1.0 + min(artisan_experience_years, 30) * 0.006  # skilled artisans command more

    demand = random.choices(DEMAND_LEVELS, weights=[0.25, 0.45, 0.30])[0]

    total_cost = material_cost + labour_cost + packaging_cost
    base_margin = random.uniform(*cfg["margin"])

    price = (
        total_cost
        * base_margin
        * DEMAND_BOOST[demand]
        * experience_premium
        * region_mult
    )
    # market noise — real prices never follow a formula exactly
    price *= random.gauss(1.0, 0.06)
    price = max(total_cost * 1.05, round(price, 2))  # never below a thin margin over cost

    return {
        "category": category,
        "region": region,
        "material_cost": material_cost,
        "labour_cost": labour_cost,
        "production_days": days,
        "packaging_cost": packaging_cost,
        "artisan_experience_years": artisan_experience_years,
        "market_demand": demand,
        "price": round(price, 2),
    }


def main():
    rows = []
    for category in CATEGORIES:
        for _ in range(N_PER_CATEGORY):
            rows.append(make_row(category))
    random.shuffle(rows)

    fieldnames = [
        "category", "region", "material_cost", "labour_cost", "production_days",
        "packaging_cost", "artisan_experience_years", "market_demand", "price",
    ]
    out_path = os.path.abspath(OUT_PATH)
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {out_path}")


if __name__ == "__main__":
    main()
