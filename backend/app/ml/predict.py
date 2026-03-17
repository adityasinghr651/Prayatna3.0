import numpy as np
import pandas as pd
import joblib
import json
import logging
from pathlib import Path
from typing import Optional

from app.ml.features import (
    FEATURE_COLUMNS,
    extract_features,
    extract_features_from_db_rows,
)

logger = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────
MODEL_PATH    = Path(__file__).parent / "model.pkl"
METADATA_PATH = Path(__file__).parent / "model_metadata.json"


class RiskPredictor:
    """
    Loads the trained XGBoost model and provides
    predict() method used by the risk engine.
    """

    def __init__(self):
        self.model    = None
        self.metadata = {}
        self._load_model()

    def _load_model(self):
        """Load model from disk. Called once at startup."""
        if not MODEL_PATH.exists():
            logger.error(
                "[ML] model.pkl not found. "
                "Run: python -m app.ml.train"
            )
            return

        self.model = joblib.load(MODEL_PATH)
        logger.info("[ML] Model loaded successfully.")

        if METADATA_PATH.exists():
            with open(METADATA_PATH) as f:
                self.metadata = json.load(f)
            logger.info(
                f"[ML] Model version: {self.metadata.get('version')} "
                f"| R²: {self.metadata.get('metrics', {}).get('r2')}"
            )

    def predict(
        self,
        weather:  dict,
        traffic:  dict,
        camera:   dict,
        events:   list,
        social:   dict,
    ) -> dict:
        """
        Run risk prediction on current data.

        Returns dict with:
            risk_score:  float 0.0 - 1.0
            risk_level:  'SAFE' | 'MEDIUM' | 'HIGH'
            features:    the feature vector used
            explanation: per-feature contribution
        """
        if self.model is None:
            logger.warning("[ML] Model not loaded — returning fallback score.")
            return self._fallback_prediction(weather, traffic, camera)

        # ── Extract feature vector ────────────────────────────
        features_df = extract_features(
            weather=weather,
            traffic=traffic,
            camera=camera,
            events=events,
            social=social,
        )

        # ── Run prediction ────────────────────────────────────
        raw_score = float(self.model.predict(features_df)[0])
        risk_score = round(np.clip(raw_score, 0.0, 1.0), 3)

        # ── Determine risk level ──────────────────────────────
        if risk_score >= 0.7:
            risk_level = "HIGH"
        elif risk_score >= 0.4:
            risk_level = "MEDIUM"
        else:
            risk_level = "SAFE"

        # ── Build explanation (for XAI panel) ─────────────────
        explanation = self._explain_prediction(
            features_df, risk_score
        )

        return {
            "risk_score":  risk_score,
            "risk_level":  risk_level,
            "features":    features_df.iloc[0].to_dict(),
            "explanation": explanation,
            "model_version": self.metadata.get("version", "unknown"),
        }

    def _explain_prediction(
        self,
        features_df: pd.DataFrame,
        risk_score: float,
    ) -> dict:
        """
        Generate human-readable explanation of
        what factors contributed to the risk score.
        Used by the frontend ExplainAI panel.
        """
        feature_importance = self.metadata.get(
            "feature_importance", {}
        )
        feature_values = features_df.iloc[0].to_dict()

        contributions = []
        for feature in FEATURE_COLUMNS:
            importance = feature_importance.get(feature, 0.0)
            value      = feature_values.get(feature, 0.0)

            # Contribution = importance × feature value
            contribution = round(importance * value * risk_score, 4)

            contributions.append({
                "feature":      feature,
                "value":        round(float(value), 4),
                "importance":   round(float(importance), 4),
                "contribution": contribution,
            })

        # Sort by contribution descending
        contributions.sort(
            key=lambda x: x["contribution"],
            reverse=True,
        )

        # Build plain English reasons
        reasons = []
        feature_row = features_df.iloc[0]

        if feature_row["rainfall_1h"] > 0.2:
            reasons.append("Heavy rainfall increasing accident risk")
        if feature_row["congestion_ratio"] > 0.4:
            reasons.append("Significant traffic congestion detected")
        if feature_row["incident_count_norm"] > 0.1:
            reasons.append("Active road incidents reported")
        if feature_row["road_closure"] > 0:
            reasons.append("Road closure in effect")
        if feature_row["crowd_density"] > 0.4:
            reasons.append("High crowd density observed by camera")
        if feature_row["event_attendance_norm"] > 0.1:
            reasons.append("Large public event nearby")
        if feature_row["visibility_norm"] > 0.5:
            reasons.append("Reduced visibility conditions")
        if feature_row["is_peak_hour"] > 0:
            reasons.append("Peak traffic hour")
        if feature_row["social_signal_norm"] > 0.05:
            reasons.append("Social media reporting incidents")

        if not reasons:
            reasons.append("Normal conditions — no elevated risk factors")

        return {
            "reasons":        reasons,
            "contributions":  contributions[:5],  # top 5 only
            "risk_score":     risk_score,
        }

    def _fallback_prediction(
        self,
        weather: dict,
        traffic: dict,
        camera:  dict,
    ) -> dict:
        """
        Simple rule-based fallback when model is not loaded.
        Ensures the system still works without model.pkl.
        """
        score = 0.0

        rain = float(weather.get("rainfall_1h", 0) or 0)
        if rain > 20:
            score += 0.3
        elif rain > 5:
            score += 0.15

        congestion = float(traffic.get("congestion_ratio", 1) or 1)
        if congestion < 0.3:
            score += 0.3
        elif congestion < 0.6:
            score += 0.15

        incidents = int(traffic.get("incident_count", 0) or 0)
        score += min(incidents * 0.05, 0.2)

        risk_score = round(min(score, 1.0), 3)
        risk_level = (
            "HIGH"   if risk_score >= 0.7 else
            "MEDIUM" if risk_score >= 0.4 else
            "SAFE"
        )

        return {
            "risk_score":    risk_score,
            "risk_level":    risk_level,
            "features":      {},
            "explanation":   {
                "reasons":       ["Fallback mode — model not loaded"],
                "contributions": [],
                "risk_score":    risk_score,
            },
            "model_version": "fallback",
        }

    def is_ready(self) -> bool:
        return self.model is not None

    def get_metadata(self) -> dict:
        return self.metadata


# ── Singleton predictor instance ──────────────────────────────
_predictor_instance: RiskPredictor | None = None


def get_predictor() -> RiskPredictor:
    """Returns singleton predictor — loads model once."""
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = RiskPredictor()
    return _predictor_instance