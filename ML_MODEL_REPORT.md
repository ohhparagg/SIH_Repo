# CRAFTORA ML Model Report

## MODEL 1: Real-ESRGAN
- **Purpose:** Image Enhancement / Super Resolution
- **Dataset:** Image Super Resolution (Kaggle)
- **Preprocessing:** HR/LR pair generation.
- **Training Method:** Transfer learning from base Real-ESRGAN weights.
- **Status:** Script written (`backend/ml/enhancement/train.py`), awaiting dataset for execution.
- **Model File:** `models/enhancement/realesrgan_v1.pth`
- **Inference Command:** `python backend/ml/test_pipeline.py <image>`

## MODEL 2: YOLO11n
- **Purpose:** Object Detection
- **Dataset:** TBD (Requires YOLO format bounding boxes from provided datasets)
- **Training Method:** Fine-tuning YOLO11n on handicraft categories.
- **Status:** Script written (`backend/ml/detection/train.py`), awaiting dataset for execution.
- **Model File:** `models/detector/yolo11n_v1.pt`

## MODEL 3: EfficientNet-B0
- **Purpose:** Image Classification
- **Dataset:** Fashion Product Images / FabricNet
- **Training Method:** Transfer learning.
- **Status:** Script written (`backend/ml/classification/train.py`), awaiting dataset for execution.
- **Model File:** `models/classifier/efficientnet_b0_v1.pt`

## MODEL 4: XGBoost Regressor
- **Purpose:** Indicative Price Prediction
- **Dataset:** Amazon ML Challenge
- **Training Method:** Gradient boosting on structured features.
- **Status:** Script written (`backend/ml/pricing/train.py`), awaiting dataset for execution.
- **Model File:** `models/pricing/xgboost_v1.json`

## MODEL 5: Qwen2.5 3B (Ollama)
- **Purpose:** Local Catalog Generation
- **Dataset:** Pre-trained LLM
- **Training Method:** Zero-shot prompting with structured attributes.
- **Status:** Integrated via heuristic prompt fallbacks in `backend/ml/pipeline/catalog_generator.py`.

*Note: Actual metrics (PSNR, mAP, Accuracy, RMSE) will be populated after the training scripts are successfully executed on the datasets.*
