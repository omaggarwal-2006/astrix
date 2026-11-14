"""
LANDFALL Model Training - Simple Model: Ridge Regression (train.py)
NASA Space Apps Challenge 2026 - Health Monitoring Software

Trains a small, explainable Ridge Regression baseline across the 6 landing-day targets:
  1. Bone Mineral Density Retention (%)
  2. Musculoskeletal Strength Retention (%)
  3. Cardiorespiratory Aerobic Retention (%)
  4. Neurovestibular Balance Retention (%)
  5. Circadian Sleep Readiness (0-100)
  6. Behavioral Mood Resilience (0-100)

Features standard feature normalization (StandardScaler), L2 regularization, and
calibrated empirical quantile residual intervals (10th, 50th, 90th percentiles) for
low/mid/high uncertainty bands.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

from dataset import create_landfall_splits, FEATURE_COLUMNS, TARGET_COLUMNS

MODEL_OUTPUT_PATH = Path(__file__).parent / "ridge_model_checkpoint.json"


class LandfallRidgeEngine:
    """Multi-target Ridge Regression engine with calibrated uncertainty bands."""

    def __init__(self, alpha: float = 1.0):
        self.alpha = alpha
        self.scaler = StandardScaler()
        self.models: Dict[str, Ridge] = {}
        self.uncertainty_bands: Dict[str, Dict[str, float]] = {}
        self.feature_columns = FEATURE_COLUMNS
        self.target_columns = TARGET_COLUMNS

    def fit(self, train_df: pd.DataFrame, val_df: pd.DataFrame):
        X_train = train_df[self.feature_columns].values
        X_train_scaled = self.scaler.fit_transform(X_train)

        X_val = val_df[self.feature_columns].values
        X_val_scaled = self.scaler.transform(X_val)

        for target in self.target_columns:
            y_train = train_df[target].values
            y_val = val_df[target].values

            # Fit Ridge model for mid (point forecast)
            reg = Ridge(alpha=self.alpha)
            reg.fit(X_train_scaled, y_train)
            self.models[target] = reg

            # Calibrate empirical quantile residuals on validation set for low/high bands
            y_val_pred = reg.predict(X_val_scaled)
            residuals = y_val - y_val_pred

            # 10th and 90th percentile residual offsets
            q10 = float(np.percentile(residuals, 10))
            q90 = float(np.percentile(residuals, 90))

            self.uncertainty_bands[target] = {
                "q10_offset": round(q10, 4),
                "q90_offset": round(q90, 4),
                "val_mae": round(float(mean_absolute_error(y_val, y_val_pred)), 4),
                "val_rmse": round(float(root_mean_squared_error(y_val, y_val_pred)), 4),
                "val_r2": round(float(r2_score(y_val, y_val_pred)), 4)
            }

    def predict(self, X_input: np.ndarray) -> Dict[str, Dict[str, np.ndarray]]:
        """Returns { target_name: { 'low': arr, 'mid': arr, 'high': arr } }"""
        X_scaled = self.scaler.transform(X_input)
        preds = {}

        for target in self.target_columns:
            mid = self.models[target].predict(X_scaled)
            low = mid + self.uncertainty_bands[target]["q10_offset"]
            high = mid + self.uncertainty_bands[target]["q90_offset"]
            preds[target] = {
                "low": low,
                "mid": mid,
                "high": high
            }
        return preds

    def evaluate(self, df: pd.DataFrame) -> Dict[str, Dict[str, float]]:
        X = df[self.feature_columns].values
        preds = self.predict(X)
        metrics = {}

        for target in self.target_columns:
            y_true = df[target].values
            y_mid = preds[target]["mid"]
            y_low = preds[target]["low"]
            y_high = preds[target]["high"]

            mae = mean_absolute_error(y_true, y_mid)
            rmse = root_mean_squared_error(y_true, y_mid)
            r2 = r2_score(y_true, y_mid)
            # Coverage: fraction of true values falling between low and high
            coverage = np.mean((y_true >= y_low) & (y_true <= y_high))

            metrics[target] = {
                "mae": round(float(mae), 3),
                "rmse": round(float(rmse), 3),
                "r2": round(float(r2), 3),
                "coverage_pct": round(float(coverage * 100.0), 1)
            }
        return metrics

    def to_dict(self) -> Dict[str, Any]:
        """Serializes model weights and parameters to a JSON-compatible dictionary."""
        model_dict = {
            "model_type": "RidgeRegression",
            "version": "1.0.0-ridge",
            "alpha": self.alpha,
            "feature_columns": self.feature_columns,
            "target_columns": self.target_columns,
            "scaler": {
                "mean": self.scaler.mean_.round(6).tolist(),
                "scale": self.scaler.scale_.round(6).tolist()
            },
            "coefficients": {},
            "intercepts": {},
            "uncertainty_offsets": {}
        }

        for target in self.target_columns:
            reg = self.models[target]
            model_dict["coefficients"][target] = reg.coef_.round(6).tolist()
            model_dict["intercepts"][target] = round(float(reg.intercept_), 6)
            model_dict["uncertainty_offsets"][target] = {
                "low_offset": self.uncertainty_bands[target]["q10_offset"],
                "high_offset": self.uncertainty_bands[target]["q90_offset"]
            }

        return model_dict


def run_training():
    print("Loading data splits...")
    splits = create_landfall_splits(n_train=140, n_val=30, n_test=30, n_shift_test=30, seed=42)

    print("\nTraining Ridge Regression baseline model...")
    engine = LandfallRidgeEngine(alpha=1.0)
    engine.fit(splits["train"], splits["val"])

    print("\nEvaluating on Validation Set:")
    val_metrics = engine.evaluate(splits["val"])
    print(f"{'Target Dimension':<18} | {'MAE':<7} | {'RMSE':<7} | {'R²':<7} | {'Band Coverage':<13}")
    print("-" * 62)
    for target, m in val_metrics.items():
        name = target.replace("target_", "")
        print(f"{name:<18} | {m['mae']:<7.3f} | {m['rmse']:<7.3f} | {m['r2']:<7.3f} | {m['coverage_pct']:<5.1f}%")

    # Save checkpoint
    model_json = engine.to_dict()
    with open(MODEL_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(model_json, f, indent=2)
    print(f"\nModel checkpoint saved to: {MODEL_OUTPUT_PATH}")
    print(f"Checkpoint file size: {MODEL_OUTPUT_PATH.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    run_training()
