"""
Data preparation script.
Converts any CSV dataset into our feature format.

Supported dataset formats:
1. Kaggle Road Accident India
2. Custom CSV with columns mapped below
3. Our synthetic data (fallback)

Usage:
    python -m app.ml.prepare_data --input datasets/your_file.csv
"""

import pandas as pd
import numpy as np
import argparse
import json
from pathlib import Path
from datetime import datetime

OUTPUT_PATH = Path(__file__).parent / "datasets" / "processed_training_data.csv"


def load_kaggle_accident_data(filepath: str) -> pd.DataFrame:
    """
    Loads Kaggle India Road Accident dataset.
    Columns expected:
    Date, Time, District, Severity, Weather, Road_Type,
    Vehicles_Involved, Casualties, Light_Conditions
    """
    print(f"[Data] Loading Kaggle dataset: {filepath}")
    df = pd.read_csv(filepath)
    print(f"[Data] Raw rows: {len(df)}")
    print(f"[Data] Columns: {list(df.columns)}")
    return df


def map_kaggle_to_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Maps Kaggle accident dataset columns
    to our 19 feature format.
    """
    mapped = pd.DataFrame()

    # Time features
    if "Time" in df.columns:
        df["hour"] = pd.to_datetime(
            df["Time"], errors="coerce"
        ).dt.hour.fillna(12)
    else:
        df["hour"] = np.random.randint(0, 24, len(df))

    mapped["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    mapped["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)

    if "Date" in df.columns:
        df["weekday"] = pd.to_datetime(
            df["Date"], errors="coerce"
        ).dt.weekday.fillna(0)
        mapped["is_weekend"]   = (df["weekday"] >= 5).astype(float)
        mapped["is_peak_hour"] = df["hour"].apply(
            lambda h: 1.0 if h in range(8, 10) or h in range(17, 20) else 0.0
        )
        mapped["is_night"] = df["hour"].apply(
            lambda h: 1.0 if h >= 22 or h < 6 else 0.0
        )
    else:
        mapped["is_weekend"]   = np.random.choice([0.0, 1.0], len(df), p=[0.7, 0.3])
        mapped["is_peak_hour"] = np.random.choice([0.0, 1.0], len(df), p=[0.6, 0.4])
        mapped["is_night"]     = np.random.choice([0.0, 1.0], len(df), p=[0.8, 0.2])

    # Weather features
    if "Weather" in df.columns:
        weather_map = {
            "Clear":   {"rain": 0.0,  "vis": 0.1, "wind": 0.1},
            "Rain":    {"rain": 0.5,  "vis": 0.6, "wind": 0.3},
            "Fog":     {"rain": 0.1,  "vis": 0.9, "wind": 0.1},
            "Storm":   {"rain": 0.9,  "vis": 0.8, "wind": 0.8},
            "Cloudy":  {"rain": 0.1,  "vis": 0.2, "wind": 0.2},
        }
        mapped["rainfall_1h"]       = df["Weather"].map(
            lambda w: weather_map.get(str(w), {"rain": 0.1})["rain"]
        ) + np.random.normal(0, 0.05, len(df))
        mapped["visibility_norm"]   = df["Weather"].map(
            lambda w: weather_map.get(str(w), {"vis": 0.2})["vis"]
        ) + np.random.normal(0, 0.05, len(df))
        mapped["wind_speed"]        = df["Weather"].map(
            lambda w: weather_map.get(str(w), {"wind": 0.1})["wind"]
        ) + np.random.normal(0, 0.03, len(df))
    else:
        mapped["rainfall_1h"]     = np.random.beta(1, 5, len(df))
        mapped["visibility_norm"] = np.random.beta(2, 5, len(df))
        mapped["wind_speed"]      = np.random.beta(1, 4, len(df))

    mapped["temperature"] = np.random.normal(0.6, 0.15, len(df))
    mapped["humidity"]    = np.random.normal(0.6, 0.2,  len(df))

    # Traffic features
    if "Vehicles_Involved" in df.columns:
        mapped["incident_count_norm"] = np.clip(
            df["Vehicles_Involved"].fillna(1) / 20, 0, 1
        )
        mapped["congestion_ratio"]    = np.clip(
            df["Vehicles_Involved"].fillna(1) / 10, 0, 1
        )
    else:
        mapped["incident_count_norm"] = np.random.beta(1, 5, len(df))
        mapped["congestion_ratio"]    = np.random.beta(2, 5, len(df))

    mapped["road_closure"] = np.random.choice(
        [0.0, 1.0], len(df), p=[0.95, 0.05]
    )

    # Camera features
    if "Casualties" in df.columns:
        mapped["person_count_norm"]  = np.clip(
            df["Casualties"].fillna(0) / 50, 0, 1
        )
        mapped["crowd_density"]      = np.clip(
            df["Casualties"].fillna(0) / 30, 0, 1
        )
    else:
        mapped["person_count_norm"] = np.random.beta(2, 5, len(df))
        mapped["crowd_density"]     = np.random.beta(1, 5, len(df))

    mapped["vehicle_count_norm"] = np.random.beta(2, 4, len(df))

    # Event features
    mapped["event_attendance_norm"] = np.random.beta(1, 10, len(df))
    mapped["event_rank_norm"]       = np.random.beta(1, 8,  len(df))

    # Social features
    mapped["social_signal_norm"] = np.random.beta(1, 15, len(df))

    # Clip all to 0-1
    for col in mapped.columns:
        mapped[col] = np.clip(mapped[col], 0.0, 1.0)

    # Generate risk score label
    if "Severity" in df.columns:
        severity_map = {
            "Fatal":    0.9,
            "Serious":  0.7,
            "Minor":    0.4,
            "Slight":   0.3,
            "Damage":   0.2,
        }
        base_risk = df["Severity"].map(
            lambda s: severity_map.get(str(s), 0.5)
        ).fillna(0.5)
        mapped["risk_score"] = np.clip(
            base_risk + np.random.normal(0, 0.05, len(df)),
            0.0, 1.0
        )
    else:
        # Compute from features
        mapped["risk_score"] = np.clip(
            (mapped["rainfall_1h"]       * 0.20) +
            (mapped["visibility_norm"]   * 0.10) +
            (mapped["congestion_ratio"]  * 0.25) +
            (mapped["incident_count_norm"]* 0.10) +
            (mapped["road_closure"]      * 0.10) +
            (mapped["crowd_density"]     * 0.10) +
            (mapped["event_attendance_norm"] * 0.05) +
            (mapped["social_signal_norm"] * 0.03) +
            (mapped["is_peak_hour"]      * 0.04) +
            (mapped["is_night"]          * 0.03) +
            np.random.normal(0, 0.03, len(df)),
            0.0, 1.0
        )

    return mapped


def generate_indore_specific_data(n: int = 3000) -> pd.DataFrame:
    """
    Generate Indore-specific synthetic data
    based on known city patterns.
    """
    print(f"[Data] Generating {n} Indore-specific samples...")

    rows = []
    locations = [
        "Vijay Nagar",
        "Rajwada",
        "Palasia",
        "MB Road",
        "Bhawarkuan",
        "Scheme 54",
        "LIG Colony",
        "Bhanwarkuan",
    ]

    for _ in range(n):
        hour    = np.random.randint(0, 24)
        weekday = np.random.randint(0, 7)
        season  = np.random.choice(
            ["summer", "monsoon", "winter"],
            p=[0.35, 0.35, 0.30],
        )
        location = np.random.choice(locations)

        # Season-based weather — Indore specific
        if season == "monsoon":
            rainfall = max(0, np.random.exponential(20))
            vis_norm = min(1, np.random.beta(3, 2))
            temp     = np.random.normal(28, 3) / 50
            wind     = max(0, np.random.exponential(8)) / 30
        elif season == "summer":
            rainfall = max(0, np.random.exponential(1))
            vis_norm = min(1, np.random.beta(5, 2))
            temp     = np.random.normal(42, 4) / 50
            wind     = max(0, np.random.exponential(4)) / 30
        else:
            rainfall = max(0, np.random.exponential(0.5))
            vis_norm = min(1, np.random.beta(4, 3))
            temp     = np.random.normal(18, 5) / 50
            wind     = max(0, np.random.exponential(3)) / 30

        is_peak = 1.0 if hour in range(8, 10) or hour in range(17, 20) else 0.0
        base_congestion = 0.5 if is_peak else 0.2

        congestion = min(1, max(0, np.random.normal(base_congestion, 0.15)))
        incidents  = np.random.poisson(3 if is_peak else 1)

        risk = np.clip(
            (min(1, rainfall / 100)    * 0.20) +
            (vis_norm                  * 0.10) +
            (congestion                * 0.25) +
            (min(1, incidents / 20)    * 0.10) +
            (min(1, temp)              * 0.05) +
            (is_peak                   * 0.04) +
            (float(hour >= 22 or hour < 6) * 0.03) +
            np.random.normal(0, 0.03),
            0.0, 1.0
        )

        rows.append({
            "hour_sin":              np.sin(2 * np.pi * hour / 24),
            "hour_cos":              np.cos(2 * np.pi * hour / 24),
            "is_weekend":            float(weekday >= 5),
            "is_peak_hour":          is_peak,
            "is_night":              float(hour >= 22 or hour < 6),
            "temperature":           np.clip(temp, 0, 1),
            "rainfall_1h":           np.clip(rainfall / 100, 0, 1),
            "wind_speed":            np.clip(wind, 0, 1),
            "visibility_norm":       np.clip(vis_norm, 0, 1),
            "humidity":              np.clip(np.random.normal(0.65, 0.2), 0, 1),
            "congestion_ratio":      congestion,
            "incident_count_norm":   np.clip(incidents / 20, 0, 1),
            "road_closure":          float(np.random.random() < 0.04),
            "person_count_norm":     np.clip(np.random.normal(0.3 if is_peak else 0.1, 0.1), 0, 1),
            "vehicle_count_norm":    np.clip(np.random.normal(0.4 if is_peak else 0.15, 0.1), 0, 1),
            "crowd_density":         np.clip(np.random.normal(0.25 if is_peak else 0.08, 0.1), 0, 1),
            "event_attendance_norm": np.clip(np.random.exponential(0.05), 0, 1),
            "event_rank_norm":       np.clip(np.random.exponential(0.1), 0, 1),
            "social_signal_norm":    np.clip(np.random.exponential(0.02), 0, 1),
            "risk_score":            round(float(risk), 4),
            "location":              location,
            "season":                season,
        })

    return pd.DataFrame(rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=str, default=None,
                        help="Path to Kaggle CSV dataset")
    parser.add_argument("--samples", type=int, default=3000,
                        help="Synthetic samples to generate")
    args = parser.parse_args()

    dfs = []

    # Load Kaggle dataset if provided
    if args.input and Path(args.input).exists():
        raw = load_kaggle_accident_data(args.input)
        mapped = map_kaggle_to_features(raw)
        mapped = mapped.dropna()
        dfs.append(mapped)
        print(f"[Data] Kaggle data mapped: {len(mapped)} rows")

    # Always add Indore synthetic data
    indore_df = generate_indore_specific_data(args.samples)
    # Drop metadata cols before saving
    feature_cols = indore_df.columns.tolist()
    feature_cols = [c for c in feature_cols if c not in ["location", "season"]]
    dfs.append(indore_df[feature_cols])

    # Combine
    final = pd.concat(dfs, ignore_index=True)
    final = final.dropna()

    # Save
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    final.to_csv(OUTPUT_PATH, index=False)

    print(f"\n[Data] Final dataset: {len(final)} rows")
    print(f"[Data] Saved to: {OUTPUT_PATH}")
    print(f"\n[Data] Risk distribution:")
    print(f"  Safe   (< 0.4): {(final.risk_score < 0.4).sum()}")
    print(f"  Medium (0.4-0.7): {((final.risk_score >= 0.4) & (final.risk_score < 0.7)).sum()}")
    print(f"  High   (>= 0.7): {(final.risk_score >= 0.7).sum()}")

    print("\n[Data] Ready to train. Run:")
    print("  python -m app.ml.train --use-real-data")


if __name__ == "__main__":
    main()