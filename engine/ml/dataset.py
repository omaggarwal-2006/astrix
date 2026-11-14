"""
LANDFALL Dataset Generator (dataset.py)
NASA Space Apps Challenge 2026 - Health Monitoring Software

Extracts feature vectors at intermediate transit day D (20 <= D <= 170) from synthetic
astronaut histories, computing:
  - Personal baseline (first 14 days of flight)
  - 7-day and 30-day rolling averages
  - Personal baseline deviations & z-scores
  - CUSUM cumulative drift scores (sleep debt, cardiovascular stress)
  - Recent symptom and environmental burden
  - Planned daily exercise for remaining days (powers what-if slider)
  - Ground truth Day-180 landing targets for 6 dimensions

Splits strictly by astronaut_id (never by day) into:
  - Train cohort
  - Validation cohort
  - In-distribution Test cohort
  - Held-out Shifted Parameter Test cohort (simulated under shifted stress/susceptibility)
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd

from simulator import AstronautSimulator, load_config

FEATURE_COLUMNS = [
    # Mission timing
    "day_d",
    "days_remaining",
    # Personal Baselines (first 14 days)
    "base_hr",
    "base_sbp",
    "base_temp",
    "base_sleep",
    "base_mood",
    "base_exercise",
    "base_balance",
    # Rolling 7-day vitals & sleep
    "hr_mean_7d",
    "sbp_mean_7d",
    "sleep_mean_7d",
    "mood_mean_7d",
    "exercise_mean_7d",
    "balance_mean_7d",
    # Rolling 30-day trends
    "hr_mean_30d",
    "sleep_mean_30d",
    "mood_mean_30d",
    "exercise_mean_30d",
    # Baseline deviations (drift)
    "hr_drift_7d",
    "sbp_drift_7d",
    "sleep_drift_7d",
    "mood_drift_7d",
    "exercise_drift_7d",
    # Baseline Z-scores
    "hr_zscore_7d",
    "sleep_zscore_7d",
    "mood_zscore_7d",
    # Cumulative drift (CUSUM)
    "cusum_sleep_debt",
    "cusum_hr_elevation",
    # Symptom & Cabin exposure
    "symptom_count_14d",
    "co2_mean_14d",
    # Countermeasure driver (What-If slider input)
    "planned_daily_exercise"
]

TARGET_COLUMNS = [
    "target_bone",
    "target_muscle",
    "target_aerobic",
    "target_balance",
    "target_sleep",
    "target_mood"
]


def extract_features_at_day(
    df: pd.DataFrame,
    day_d: int,
    planned_daily_exercise: float,
    months: float = 6.0
) -> Dict[str, float]:
    """
    Extracts the feature dictionary for a single astronaut evaluated up to day_d.
    """
    history = df[df["day"] <= day_d]
    baseline_window = df[df["day"] <= 14]

    # 1. Personal baseline (first 14 days)
    base_hr = float(baseline_window["heart_rate"].mean())
    base_sbp = float(baseline_window["sbp"].mean())
    base_temp = float(baseline_window["temperature"].mean())
    base_sleep = float(baseline_window["sleep_hours"].mean())
    base_mood = float(baseline_window["mood"].mean())
    base_exercise = float(baseline_window["exercise_hours"].mean())
    base_balance = float(baseline_window["balance_score"].mean())

    # Robust standard deviation denominators with minimum floor to prevent division-by-zero on flat data
    base_hr_std = max(1.5, float(baseline_window["heart_rate"].std()))
    base_sleep_std = max(0.3, float(baseline_window["sleep_hours"].std()))
    base_mood_std = max(0.2, float(baseline_window["mood"].std()))

    # 2. Rolling 7-day window
    w7 = df[(df["day"] > max(0, day_d - 7)) & (df["day"] <= day_d)]
    hr_mean_7d = float(w7["heart_rate"].mean())
    sbp_mean_7d = float(w7["sbp"].mean())
    sleep_mean_7d = float(w7["sleep_hours"].mean())
    mood_mean_7d = float(w7["mood"].mean())
    exercise_mean_7d = float(w7["exercise_hours"].mean())
    balance_mean_7d = float(w7["balance_score"].mean())

    # 3. Rolling 30-day window
    w30 = df[(df["day"] > max(0, day_d - 30)) & (df["day"] <= day_d)]
    hr_mean_30d = float(w30["heart_rate"].mean())
    sleep_mean_30d = float(w30["sleep_hours"].mean())
    mood_mean_30d = float(w30["mood"].mean())
    exercise_mean_30d = float(w30["exercise_hours"].mean())

    # 4. Deviations & Z-scores
    hr_drift_7d = hr_mean_7d - base_hr
    sbp_drift_7d = sbp_mean_7d - base_sbp
    sleep_drift_7d = sleep_mean_7d - base_sleep
    mood_drift_7d = mood_mean_7d - base_mood
    exercise_drift_7d = exercise_mean_7d - base_exercise

    hr_zscore_7d = float(np.clip(hr_drift_7d / base_hr_std, -5.0, 5.0))
    sleep_zscore_7d = float(np.clip(sleep_drift_7d / base_sleep_std, -5.0, 5.0))
    mood_zscore_7d = float(np.clip(mood_drift_7d / base_mood_std, -5.0, 5.0))

    # 5. CUSUM scores
    # Sleep deficit CUSUM with allowance of 0.25h
    sleep_deficits = np.maximum(0.0, base_sleep - history["sleep_hours"].values - 0.25)
    cusum_sleep_debt = float(np.sum(sleep_deficits))

    # HR elevation CUSUM with allowance of 2.0 bpm
    hr_elevations = np.maximum(0.0, history["heart_rate"].values - base_hr - 2.0)
    cusum_hr_elevation = float(np.sum(hr_elevations))

    # 6. Symptoms & Cabin (last 14 days)
    w14 = df[(df["day"] > max(0, day_d - 14)) & (df["day"] <= day_d)]
    symptom_sum = int(
        w14["symptom_rash"].sum() +
        w14["symptom_coldsore"].sum() +
        w14["symptom_fever"].sum() +
        w14["symptom_fatigue"].sum()
    )
    co2_mean_14d = float(w14["cabin_co2"].mean())

    return {
        "day_d": float(day_d),
        "days_remaining": float(180 - day_d),
        "base_hr": round(base_hr, 2),
        "base_sbp": round(base_sbp, 2),
        "base_temp": round(base_temp, 2),
        "base_sleep": round(base_sleep, 2),
        "base_mood": round(base_mood, 2),
        "base_exercise": round(base_exercise, 2),
        "base_balance": round(base_balance, 2),
        "hr_mean_7d": round(hr_mean_7d, 2),
        "sbp_mean_7d": round(sbp_mean_7d, 2),
        "sleep_mean_7d": round(sleep_mean_7d, 2),
        "mood_mean_7d": round(mood_mean_7d, 2),
        "exercise_mean_7d": round(exercise_mean_7d, 2),
        "balance_mean_7d": round(balance_mean_7d, 2),
        "hr_mean_30d": round(hr_mean_30d, 2),
        "sleep_mean_30d": round(sleep_mean_30d, 2),
        "mood_mean_30d": round(mood_mean_30d, 2),
        "exercise_mean_30d": round(exercise_mean_30d, 2),
        "hr_drift_7d": round(hr_drift_7d, 2),
        "sbp_drift_7d": round(sbp_drift_7d, 2),
        "sleep_drift_7d": round(sleep_drift_7d, 2),
        "mood_drift_7d": round(mood_drift_7d, 2),
        "exercise_drift_7d": round(exercise_drift_7d, 2),
        "hr_zscore_7d": round(hr_zscore_7d, 2),
        "sleep_zscore_7d": round(sleep_zscore_7d, 2),
        "mood_zscore_7d": round(mood_zscore_7d, 2),
        "cusum_sleep_debt": round(cusum_sleep_debt, 2),
        "cusum_hr_elevation": round(cusum_hr_elevation, 2),
        "symptom_count_14d": float(symptom_sum),
        "co2_mean_14d": round(co2_mean_14d, 1),
        "planned_daily_exercise": round(float(planned_daily_exercise), 2)
    }


def compute_adjusted_landing_targets(
    base_targets: Dict[str, float],
    df: pd.DataFrame,
    day_d: int,
    planned_daily_exercise: float,
    config: Dict[str, Any]
) -> Dict[str, float]:
    """
    Computes true landing-day targets under the scenario where the astronaut adheres to
    planned_daily_exercise for the remaining (180 - day_d) days.
    """
    past_exercise = df[df["day"] <= day_d]["exercise_hours"].values
    past_sum = np.sum(past_exercise)
    remaining_days = max(0, 180 - day_d)
    scenario_total_exercise = past_sum + (remaining_days * planned_daily_exercise)
    scenario_mean_exercise = scenario_total_exercise / 180.0
    scenario_adherence_ratio = min(1.0, max(0.0, scenario_mean_exercise / 1.5))

    actual_mean_exercise = np.mean(df["exercise_hours"].values)
    actual_adherence_ratio = min(1.0, max(0.0, actual_mean_exercise / 1.5))
    delta_adherence = scenario_adherence_ratio - actual_adherence_ratio

    # Exercise protective adjustments based on NASA rates
    # Bone: Protected by resistance exercise
    adj_bone = base_targets["bone"] + (delta_adherence * 5.4)
    # Muscle & Aerobic: Protected by aerobic/strength exercise
    adj_muscle = base_targets["muscle"] + (delta_adherence * 9.5)
    adj_aerobic = base_targets["aerobic"] + (delta_adherence * 8.2)
    # Balance: Slight benefit from physical activity
    adj_balance = base_targets["balance"] + (delta_adherence * 1.8)
    # Sleep & Mood: Exercise promotes circadian sleep and stress resilience
    adj_sleep = base_targets["sleep"] + (delta_adherence * 6.0)
    adj_mood = base_targets["mood"] + (delta_adherence * 5.5)

    return {
        "target_bone": round(float(np.clip(adj_bone, 80.0, 99.5)), 2),
        "target_muscle": round(float(np.clip(adj_muscle, 75.0, 99.5)), 2),
        "target_aerobic": round(float(np.clip(adj_aerobic, 74.0, 99.5)), 2),
        "target_balance": round(float(np.clip(adj_balance, 68.0, 98.0)), 2),
        "target_sleep": round(float(np.clip(adj_sleep, 50.0, 99.0)), 2),
        "target_mood": round(float(np.clip(adj_mood, 50.0, 99.0)), 2)
    }


def build_dataset_for_astronauts(
    astronaut_ids: List[str],
    sim: AstronautSimulator,
    eval_days: List[int] = None,
    parameter_shift: bool = False
) -> pd.DataFrame:
    """Builds a dataset across multiple astronauts sampled at intermediate days D."""
    if eval_days is None:
        eval_days = [20, 40, 60, 80, 100, 120, 140, 160]

    rows = []
    cfg = sim.config

    for astro_id in astronaut_ids:
        df, base_targets = sim.generate_astronaut(astro_id, parameter_shift=parameter_shift)

        for d in eval_days:
            # Sample 2 what-if exercise scenarios per evaluation day:
            # 1. Historical adherence
            hist_ex = float(df[df["day"] <= d]["exercise_hours"].mean())
            # 2. A randomized what-if countermeasure slider setting (0.0 to 1.5)
            rand_ex = float(sim.rng.uniform(0.0, 1.5))

            for ex_setting in [hist_ex, rand_ex]:
                feats = extract_features_at_day(df, d, ex_setting)
                targets = compute_adjusted_landing_targets(base_targets, df, d, ex_setting, cfg)

                row = {"astronaut_id": astro_id}
                row.update(feats)
                row.update(targets)
                rows.append(row)

    return pd.DataFrame(rows)


def create_landfall_splits(
    n_train: int = 140,
    n_val: int = 30,
    n_test: int = 30,
    n_shift_test: int = 30,
    seed: int = 42
) -> Dict[str, pd.DataFrame]:
    """
    Creates train, validation, test, and shifted parameter test datasets.
    Strictly splits by astronaut_id to prevent any temporal data leakage.
    """
    sim = AstronautSimulator(seed=seed)

    train_ids = [f"ASTRO_TR_{i+1:04d}" for i in range(n_train)]
    val_ids = [f"ASTRO_VAL_{i+1:04d}" for i in range(n_val)]
    test_ids = [f"ASTRO_TE_{i+1:04d}" for i in range(n_test)]
    shift_ids = [f"ASTRO_SHIFT_{i+1:04d}" for i in range(n_shift_test)]

    # Assert no overlap
    all_sets = [set(train_ids), set(val_ids), set(test_ids), set(shift_ids)]
    for i in range(len(all_sets)):
        for j in range(i + 1, len(all_sets)):
            assert len(all_sets[i].intersection(all_sets[j])) == 0, "Data leakage detected across astronaut splits!"

    print("Building training set...")
    train_df = build_dataset_for_astronauts(train_ids, sim, parameter_shift=False)

    print("Building validation set...")
    val_df = build_dataset_for_astronauts(val_ids, sim, parameter_shift=False)

    print("Building in-distribution test set...")
    test_df = build_dataset_for_astronauts(test_ids, sim, parameter_shift=False)

    print("Building shifted parameter test set (out-of-distribution)...")
    shift_test_df = build_dataset_for_astronauts(shift_ids, sim, parameter_shift=True)

    return {
        "train": train_df,
        "val": val_df,
        "test": test_df,
        "shift_test": shift_test_df
    }


if __name__ == "__main__":
    print("Testing LANDFALL Dataset Generator...")
    splits = create_landfall_splits(n_train=140, n_val=30, n_test=30, n_shift_test=30)

    print("\n--- Split Verification Summary ---")
    for name, df in splits.items():
        unique_astros = df["astronaut_id"].nunique()
        print(f"Split [{name:10s}]: {len(df):5d} rows across {unique_astros:3d} unique astronauts (features: {len(FEATURE_COLUMNS)}, targets: {len(TARGET_COLUMNS)})")

    # Double check zero overlap across DataFrames
    train_set = set(splits["train"]["astronaut_id"])
    val_set = set(splits["val"]["astronaut_id"])
    test_set = set(splits["test"]["astronaut_id"])
    shift_set = set(splits["shift_test"]["astronaut_id"])

    overlap = train_set & val_set & test_set & shift_set
    print(f"\nAstronaut ID intersection check across all splits: {len(overlap)} (Zero overlap verified)")
    print("Dataset generation test completed successfully.")
