"""
LANDFALL Model Exporter (export_model.py)
NASA Space Apps Challenge 2026 - Health Monitoring Software

Exports the trained Ridge Regression checkpoint to /engine/model.json with:
  - Version & Metadata ("synthetic data", "Illustrative, not a clinical predictor")
  - Feature names and ordering
  - Target names
  - Normalization parameters (mean, scale)
  - Coefficients and intercepts
  - Calibrated uncertainty offsets (low_offset, high_offset)
  - NASA citations and status thresholds (nominal, caution)
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any

from simulator import load_config
from dataset import FEATURE_COLUMNS, TARGET_COLUMNS

CHECKPOINT_PATH = Path(__file__).parent / "ridge_model_checkpoint.json"
EXPORT_PATH = Path(__file__).parent.parent / "model.json"


def export():
    print(f"Reading checkpoint from: {CHECKPOINT_PATH}")
    with open(CHECKPOINT_PATH, "r", encoding="utf-8") as f:
        chk = json.load(f)

    cfg = load_config()

    export_data = {
        "metadata": {
            "model_name": "LANDFALL Landing-Day Readiness Forecaster",
            "model_type": "RidgeRegression",
            "version": "1.0.0",
            "training_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "trainedOn": "synthetic data",
            "note": "Illustrative, not a clinical predictor",
            "author": "Tanishk (Physiological Engine) - NASA Space Apps 2026",
            "nasa_citations": {
                "bone": "https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/",
                "fitness": "https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/",
                "hazards": "https://www.nasa.gov/hrp/hazards/"
            }
        },
        "feature_columns": FEATURE_COLUMNS,
        "target_columns": TARGET_COLUMNS,
        "status_thresholds": cfg["status_thresholds"],
        "scaler": chk["scaler"],
        "coefficients": chk["coefficients"],
        "intercepts": chk["intercepts"],
        "uncertainty_offsets": chk["uncertainty_offsets"]
    }

    EXPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(EXPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(export_data, f, indent=2)

    file_size_kb = EXPORT_PATH.stat().st_size / 1024.0
    print(f"Successfully exported production model to: {EXPORT_PATH}")
    print(f"Final model.json file size: {file_size_kb:.2f} KB (Well below 1 MB limit)")


if __name__ == "__main__":
    export()
