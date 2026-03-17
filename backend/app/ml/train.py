"""
XGBoost Risk Prediction Model — Training Script
"""

import numpy as np
import pandas as pd
import joblib
import json
from pathlib import Path
from datetime import datetime, timezone

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from xgboost import XGBRegressor

from app.ml.features import FEATURE_COLUMNS

MODEL_PATH    = Path(__file__).parent / "model.pkl"
METADATA_PATH = Path(__file__).parent / "model_metadata.json"

np.random.seed(42)


# ─────────────────────────────────────────────
# EXISTING FUNCTIONS (UNCHANGED)
# ─────────────────────────────────────────────

def generate_training_data(n_samples: int = 5000) -> pd.DataFrame:
    data = []

    for _ in range(n_samples):
        hour    = np.random.randint(0, 24)
        weekday = np.random.randint(0, 7)

        hour_sin = np.sin(2 * np.pi * hour / 24)
        hour_cos = np.cos(2 * np.pi * hour / 24)

        is_peak_hour = float(hour in range(8, 10) or hour in range(17, 20))
        is_weekend   = float(weekday >= 5)
        is_night     = float(hour >= 22 or hour < 6)

        season = np.random.choice(
            ["summer", "monsoon", "winter"],
            p=[0.35, 0.35, 0.30],
        )

        if season == "monsoon":
            rainfall_1h   = np.random.exponential(15)
            visibility_norm = np.random.beta(2, 2)
            temperature   = np.random.normal(28, 3) / 50
            wind_speed    = np.random.exponential(5) / 30
        elif season == "summer":
            rainfall_1h   = np.random.exponential(0.5)
            visibility_norm = np.random.beta(5, 2)
            temperature   = np.random.normal(40, 4) / 50
            wind_speed    = np.random.exponential(3) / 30
        else:
            rainfall_1h   = np.random.exponential(0.2)
            visibility_norm = np.random.beta(3, 3)
            temperature   = np.random.normal(20, 5) / 50
            wind_speed    = np.random.exponential(2) / 30

        rainfall_1h_norm = min(rainfall_1h / 100.0, 1.0)
        humidity         = np.clip(np.random.normal(0.6, 0.2), 0, 1)

        base_congestion = (
            np.random.beta(2, 5)
            if is_peak_hour
            else np.random.beta(1, 5)
        )
        congestion_ratio  = np.clip(base_congestion, 0, 1)
        incident_count    = np.random.poisson(3 if is_peak_hour else 1)
        incident_count_norm = min(incident_count / 20.0, 1.0)
        road_closure      = float(np.random.random() < 0.05)

        base_crowd = 0.5 if is_peak_hour else 0.2
        if is_night:
            base_crowd = 0.1

        person_count      = max(0, int(np.random.normal(base_crowd * 30, 8)))
        vehicle_count     = max(0, int(np.random.normal(base_crowd * 20, 5)))
        crowd_density     = min(person_count / 50.0, 1.0)
        person_count_norm = min(person_count / 50.0, 1.0)
        vehicle_count_norm = min(vehicle_count / 30.0, 1.0)

        has_event          = np.random.random() < 0.15
        event_attendance   = np.random.exponential(5000) if has_event else 0
        event_rank         = np.random.randint(40, 90)   if has_event else 0
        event_attendance_norm = min(event_attendance / 100000.0, 1.0)
        event_rank_norm    = min(event_rank / 100.0, 1.0)

        social_posts      = np.random.poisson(2)
        social_signal_norm = min(social_posts / 50.0, 1.0)

        risk = (
            (rainfall_1h_norm * 0.20) +
            (visibility_norm * 0.10) +
            (congestion_ratio * 0.25) +
            (incident_count_norm * 0.10) +
            (road_closure * 0.10) +
            (crowd_density * 0.10) +
            (event_attendance_norm * 0.05) +
            (social_signal_norm * 0.03) +
            (is_peak_hour * 0.04) +
            (is_night * 0.03)
        )

        risk = np.clip(risk + np.random.normal(0, 0.03), 0.0, 1.0)

        data.append({
            "temperature": np.clip(temperature, 0, 1),
            "rainfall_1h": rainfall_1h_norm,
            "wind_speed": np.clip(wind_speed, 0, 1),
            "visibility_norm": np.clip(visibility_norm, 0, 1),
            "humidity": humidity,
            "congestion_ratio": congestion_ratio,
            "incident_count_norm": incident_count_norm,
            "road_closure": road_closure,
            "person_count_norm": person_count_norm,
            "vehicle_count_norm": vehicle_count_norm,
            "crowd_density": crowd_density,
            "event_attendance_norm": event_attendance_norm,
            "event_rank_norm": event_rank_norm,
            "social_signal_norm": social_signal_norm,
            "hour_sin": hour_sin,
            "hour_cos": hour_cos,
            "is_weekend": is_weekend,
            "is_peak_hour": is_peak_hour,
            "is_night": is_night,
            "risk_score": round(float(risk), 4),
        })

    return pd.DataFrame(data)


# ─────────────────────────────────────────────
# ✅ FIXED FUNCTION (MOVED HERE — NO LOGIC CHANGE)
# ─────────────────────────────────────────────

def train_model_from_df(df: pd.DataFrame):
    """Train from existing DataFrame — used for real datasets."""

    print(f"\n── Training on real data ────────────────────────")
    print(f"  Total samples: {len(df)}")

    X = df[[c for c in FEATURE_COLUMNS if c in df.columns]]
    y = df["risk_score"]

    for col in FEATURE_COLUMNS:
        if col not in X.columns:
            X[col] = 0.0
    X = X[FEATURE_COLUMNS]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        reg_alpha=0.1,
        reg_lambda=1.0,
        objective="reg:squarederror",
        random_state=42,
        n_jobs=-1,
    )

    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=50)

    y_pred = np.clip(model.predict(X_test), 0.0, 1.0)

    mae  = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2   = r2_score(y_test, y_pred)

    print(f"\n── Results ──────────────────────────────────────")
    print(f"  MAE:  {mae:.4f}")
    print(f"  RMSE: {rmse:.4f}")
    print(f"  R²:   {r2:.4f}")

    joblib.dump(model, MODEL_PATH)
    print(f"\n✓ Model saved: {MODEL_PATH}")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--use-real-data", action="store_true")
    parser.add_argument("--samples", type=int, default=5000)
    args = parser.parse_args()

    PROCESSED_DATA = Path(__file__).parent / "datasets" / "processed_training_data.csv"

    if args.use_real_data and PROCESSED_DATA.exists():
        print(f"\n[Train] Using real dataset: {PROCESSED_DATA}")
        df = pd.read_csv(PROCESSED_DATA)

        feature_cols = FEATURE_COLUMNS + ["risk_score"]
        available    = [c for c in feature_cols if c in df.columns]
        df           = df[available].dropna()

        print(f"[Train] Loaded {len(df)} rows")
        train_model_from_df(df)

    else:
        if args.use_real_data:
            print("[Train] Real data not found — generating synthetic...")
        train_model()