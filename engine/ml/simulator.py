"""
LANDFALL Simulator (simulator.py)
NASA Space Apps Challenge 2026 - Health Monitoring Software

Generates synthetic longitudinal physiological telemetry for astronauts over a 180-day
Earth-to-Mars transit. Models personal baselines, multi-hazard interactions (sleep debt
affecting mood, CO2 elevation triggering symptoms), stochastic events, and landing-day
readiness based on NASA Human Research Program (HRP) published rates.

HONEST FRAMING:
This simulator produces synthetic data for modeling and architectural demonstration.
It is an illustrative educational model, NOT a clinical predictor.
"""

import os
from pathlib import Path

# Ensure Matplotlib uses a writable local cache dir
os.environ.setdefault("MPLCONFIGDIR", str(Path(__file__).parent / ".mplconfig"))

import json
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

CONFIG_PATH = Path(__file__).parent / "sim_config.json"


def load_config(config_path: Path = CONFIG_PATH) -> Dict[str, Any]:
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


class AstronautSimulator:
    """Simulates realistic synthetic physiological histories for 180-day Mars transit."""

    def __init__(self, config: Dict[str, Any] = None, seed: int = 42):
        self.config = config or load_config()
        self.rng = np.random.default_rng(seed)

    def generate_astronaut(
        self,
        astronaut_id: str,
        parameter_shift: bool = False,
        fixed_event_day: int = None
    ) -> Tuple[pd.DataFrame, Dict[str, float]]:
        """
        Generates 180 days of daily telemetry for a single astronaut.
        
        Args:
            astronaut_id: Unique string identifier.
            parameter_shift: If True, shifts parameters outside training range to test
                             model generalization on held-out simulated conditions.
            fixed_event_day: If provided, forces the planted anomaly to start on this day.
        
        Returns:
            telemetry_df: 180 rows of daily measurements.
            landing_targets: Ground truth readiness targets on landing day 180.
        """
        cfg = self.config
        days = cfg["mission"]["transit_days"]
        months = cfg["mission"]["transit_months"]

        # Shift factor for held-out test distribution
        shift_mult = 1.25 if parameter_shift else 1.0

        # 1. Personal Baselines (NASA: individuals vary significantly)
        b_dist = cfg["astronaut_baseline_distributions"]
        base_hr = float(self.rng.normal(b_dist["heart_rate_bpm"]["mean"], b_dist["heart_rate_bpm"]["std"]))
        base_sbp = float(self.rng.normal(b_dist["sbp_mmhg"]["mean"], b_dist["sbp_mmhg"]["std"]))
        base_dbp = float(self.rng.normal(b_dist["dbp_mmhg"]["mean"], b_dist["dbp_mmhg"]["std"]))
        base_temp = float(self.rng.normal(b_dist["temperature_c"]["mean"], b_dist["temperature_c"]["std"]))
        base_sleep = float(self.rng.normal(b_dist["sleep_hours"]["mean"], b_dist["sleep_hours"]["std"]))
        base_mood = float(np.clip(self.rng.normal(b_dist["mood_score"]["mean"], b_dist["mood_score"]["std"]), 3.2, 4.8))
        base_exercise = float(np.clip(self.rng.normal(b_dist["exercise_adherence_mean_hours"]["mean"], b_dist["exercise_adherence_mean_hours"]["std"]), 0.7, 1.5))

        # Individual susceptibility rates based on NASA bounds
        # NASA: 1.0 - 1.5% bone loss per month
        nasa_bone = cfg["nasa_published_rates"]["bone_loss_per_month"]
        bone_loss_rate = float(self.rng.uniform(nasa_bone["min_percent"], nasa_bone["max_percent"]) * shift_mult)

        # NASA: 10 - 12% fitness loss at full adherence; 12-38% crew experience >20% loss
        nasa_fit = cfg["nasa_published_rates"]["fitness_loss_at_full_adherence"]
        fitness_susceptibility = float(self.rng.uniform(nasa_fit["min_percent"], nasa_fit["max_percent"]) * shift_mult)
        if self.rng.random() < 0.25:  # 25% of astronauts fall into high-loss group
            fitness_susceptibility *= self.rng.uniform(1.3, 1.7)

        # 2. Stochastic Anomaly Event
        # Plant an acute disruption at a random day unless fixed
        if fixed_event_day is not None:
            event_day = fixed_event_day
        else:
            event_day = int(self.rng.integers(25, 130))
        
        event_duration = int(self.rng.integers(8, 22))
        event_severity = float(self.rng.uniform(0.5, 0.95))

        # SPE radiation storm occurrence
        has_spe = self.rng.random() < cfg["illustrative_assumptions"]["radiation_environment"]["spe_storm_probability_per_180d"]
        spe_day = int(self.rng.integers(40, 160)) if has_spe else -1

        # Arrays for 180 days
        hr_arr = np.zeros(days)
        sbp_arr = np.zeros(days)
        dbp_arr = np.zeros(days)
        temp_arr = np.zeros(days)
        sleep_arr = np.zeros(days)
        mood_arr = np.zeros(days)
        exercise_arr = np.zeros(days)
        balance_arr = np.zeros(days)
        co2_arr = np.zeros(days)
        noise_arr = np.zeros(days)
        cabin_temp_arr = np.zeros(days)
        daily_rad_arr = np.zeros(days)
        rash_arr = np.zeros(days, dtype=int)
        coldsore_arr = np.zeros(days, dtype=int)
        fever_arr = np.zeros(days, dtype=int)
        fatigue_arr = np.zeros(days, dtype=int)

        # Autoregressive noise states for natural human temporal continuity
        hr_noise = 0.0
        sleep_noise = 0.0
        mood_noise = 0.0

        sleep_debt_buffer = 0.0

        for d in range(days):
            current_day = d + 1

            # Event active window
            in_event = (event_day <= current_day < event_day + event_duration)
            event_decay = 0.0
            if in_event:
                # Bell-shaped anomaly curve inside event
                rel_d = (current_day - event_day) / event_duration
                event_decay = np.sin(rel_d * np.pi) * event_severity

            # AR(1) noise update
            hr_noise = 0.65 * hr_noise + self.rng.normal(0, 2.0)
            sleep_noise = 0.50 * sleep_noise + self.rng.normal(0, 0.35)
            mood_noise = 0.60 * mood_noise + self.rng.normal(0, 0.15)

            # Cabin environmental conditions
            # Nominal CO2 ~ 2800 ppm; during anomaly scrubber event spikes to ~ 5200 ppm
            co2 = 2800.0 + self.rng.normal(0, 150) + (2400.0 * event_decay if in_event else 0.0)
            co2_arr[d] = round(max(1500.0, co2), 1)

            noise = 58.0 + self.rng.normal(0, 2.5) + (7.0 * event_decay if in_event else 0.0)
            noise_arr[d] = round(noise, 1)

            c_temp = 21.5 + self.rng.normal(0, 0.4)
            cabin_temp_arr[d] = round(c_temp, 2)

            # Sleep hours (NASA: Inadequate sleep & irregular schedules)
            # High CO2 and noise penalize sleep
            co2_penalty = max(0.0, (co2 - 3500.0) / 2000.0) * cfg["illustrative_assumptions"]["environmental_interactions"]["co2_elevation_sleep_penalty_hours"]
            sleep_h = base_sleep + sleep_noise - (3.2 * event_decay) - co2_penalty
            sleep_h = float(np.clip(sleep_h, 3.2, 9.5))
            sleep_arr[d] = round(sleep_h, 2)

            # Sleep debt accumulation (NASA: Hazards interact)
            daily_deficit = max(0.0, base_sleep - sleep_h)
            sleep_debt_buffer = 0.85 * sleep_debt_buffer + daily_deficit

            # Mood score (1.0 to 5.0)
            # Mood is pulled down by persistent sleep debt with a 3-day lag
            mood_penalty = sleep_debt_buffer * cfg["illustrative_assumptions"]["sleep_mood_coupling"]["penalty_per_hour_sleep_debt"]
            mood = base_mood + mood_noise - mood_penalty - (0.4 * event_decay)
            mood = float(np.clip(mood, 1.0, 5.0))
            mood_arr[d] = round(mood, 2)

            # Exercise adherence (hours/day)
            # Drops during acute sickness/event
            ex = base_exercise + self.rng.normal(0, 0.18) - (0.6 * event_decay)
            ex = float(np.clip(ex, 0.0, 1.5))
            exercise_arr[d] = round(ex, 2)

            # Cardiovascular Vitals
            # Sympathetic elevation under stress, sleep loss, and microgravity deconditioning
            hr_drift = (current_day / days) * 4.0  # slight mission-duration drift
            hr = base_hr + hr_noise + (12.0 * event_decay) + (sleep_debt_buffer * 1.5) + hr_drift
            hr_arr[d] = round(hr, 1)

            sbp = base_sbp + self.rng.normal(0, 3.0) + (10.0 * event_decay) + (sleep_debt_buffer * 1.8)
            sbp_arr[d] = round(sbp, 1)

            dbp = base_dbp + self.rng.normal(0, 2.0) + (6.0 * event_decay) + (sleep_debt_buffer * 1.0)
            dbp_arr[d] = round(dbp, 1)

            # Body Temperature
            temp = base_temp + self.rng.normal(0, 0.10) + (0.5 * event_decay if in_event and event_severity > 0.8 else 0.0)
            temp_arr[d] = round(temp, 2)

            # Balance / sensorimotor weekly test score (0 to 100)
            # Declines gradually with microgravity exposure; slight dip during acute fatigue
            balance = 100.0 - ((current_day / days) * 14.0) - (8.0 * event_decay) + self.rng.normal(0, 1.5)
            balance_arr[d] = round(float(np.clip(balance, 65.0, 100.0)), 1)

            # Symptoms (NASA HRP: Spaceflight stress awakens latent viruses e.g. cold sores)
            stress_prob = min(0.85, 0.05 + 0.5 * event_decay + 0.1 * (sleep_debt_buffer / 3.0))
            rash_arr[d] = int(self.rng.random() < (0.04 + 0.15 * event_decay))
            coldsore_arr[d] = int(self.rng.random() < (0.03 + 0.35 * event_decay))
            fever_arr[d] = int(self.rng.random() < (0.02 + 0.25 * event_decay if temp > 37.1 else 0.01))
            fatigue_arr[d] = int(self.rng.random() < stress_prob)

            # Radiation (mSv/day)
            rad_cfg = cfg["illustrative_assumptions"]["radiation_environment"]
            rad = rad_cfg["daily_gcr_dose_msv"] + self.rng.normal(0, rad_cfg["gcr_std_msv"])
            if current_day == spe_day:
                rad += rad_cfg["spe_additional_dose_msv"]
            daily_rad_arr[d] = round(max(0.5, rad), 2)

        cumulative_rad_arr = np.cumsum(daily_rad_arr).round(2)

        # 3. Compute Ground Truth Landing-Day Targets (Day 180)
        # Driven by cumulative 180-day physiological trajectory and exercise adherence
        mean_exercise_adherence = float(np.mean(exercise_arr) / 1.5)  # 0.0 to 1.0 ratio
        mean_sleep_adherence = float(np.mean(sleep_arr) / base_sleep)
        mean_mood_adherence = float(np.mean(mood_arr) / base_mood)

        # Bone Mineral Density Retention (%)
        # NASA: 1.0 - 1.5% loss per month on 4-6 month missions
        # Exercise mitigates up to ~72% of bone loss
        protected_bone_rate = bone_loss_rate * (1.0 - mean_exercise_adherence * 0.72)
        total_bone_loss = months * protected_bone_rate
        bone_retention = float(np.clip(100.0 - total_bone_loss, 82.0, 99.0))

        # Muscle Strength & Aerobic Power Retention (%)
        # NASA: 10 - 12% loss under exercise protocol; worse without exercise
        fit_loss = fitness_susceptibility * (1.0 - mean_exercise_adherence * 0.85)
        muscle_retention = float(np.clip(100.0 - fit_loss, 78.0, 99.0))
        aerobic_retention = float(np.clip(100.0 - fit_loss * 0.95 - (np.mean(hr_arr[-30:]) - base_hr) * 0.4, 76.0, 99.0))

        # Neurovestibular Balance Retention (%)
        balance_retention = float(np.clip(np.mean(balance_arr[-14:]), 70.0, 96.0))

        # Sleep Readiness Score (0 to 100)
        # Combines baseline stability, final 30-day sleep deficit, and recovery
        recent_sleep = np.mean(sleep_arr[-30:])
        sleep_retention = float(np.clip((recent_sleep / base_sleep) * 92.0 + (mean_exercise_adherence * 8.0), 55.0, 98.0))

        # Mood & Behavioral Readiness Score (0 to 100)
        recent_mood = np.mean(mood_arr[-30:])
        mood_retention = float(np.clip((recent_mood / base_mood) * 88.0 + (mean_exercise_adherence * 9.0), 52.0, 98.0))

        landing_targets = {
            "bone": round(bone_retention, 2),
            "muscle": round(muscle_retention, 2),
            "aerobic": round(aerobic_retention, 2),
            "balance": round(balance_retention, 2),
            "sleep": round(sleep_retention, 2),
            "mood": round(mood_retention, 2),
            "cumulative_radiation_msv": round(float(cumulative_rad_arr[-1]), 2)
        }

        telemetry_df = pd.DataFrame({
            "astronaut_id": astronaut_id,
            "day": np.arange(1, days + 1),
            "heart_rate": hr_arr,
            "sbp": sbp_arr,
            "dbp": dbp_arr,
            "temperature": temp_arr,
            "sleep_hours": sleep_arr,
            "mood": mood_arr,
            "exercise_hours": exercise_arr,
            "balance_score": balance_arr,
            "cabin_co2": co2_arr,
            "cabin_noise": noise_arr,
            "cabin_temp": cabin_temp_arr,
            "symptom_rash": rash_arr,
            "symptom_coldsore": coldsore_arr,
            "symptom_fever": fever_arr,
            "symptom_fatigue": fatigue_arr,
            "daily_radiation": daily_rad_arr,
            "cumulative_radiation": cumulative_rad_arr,
            "base_hr": base_hr,
            "base_sbp": base_sbp,
            "base_dbp": base_dbp,
            "base_temp": base_temp,
            "base_sleep": base_sleep,
            "base_mood": base_mood,
            "base_exercise": base_exercise,
            "event_day": event_day,
            "event_duration": event_duration
        })

        return telemetry_df, landing_targets

    def generate_cohort(
        self,
        n_astronauts: int = 100,
        parameter_shift: bool = False,
        prefix: str = "ASTRO"
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Generates a cohort of synthetic astronauts."""
        all_telemetry = []
        all_targets = []

        for i in range(n_astronauts):
            astro_id = f"{prefix}_{i+1:04d}"
            df, targets = self.generate_astronaut(
                astro_id,
                parameter_shift=parameter_shift
            )
            all_telemetry.append(df)
            targets["astronaut_id"] = astro_id
            all_targets.append(targets)

        cohort_df = pd.concat(all_telemetry, ignore_index=True)
        targets_df = pd.DataFrame(all_targets)
        return cohort_df, targets_df


def plot_sample_astronauts(output_path: Path = None):
    """Generates and saves a multi-panel plot of 3 distinct synthetic astronauts."""
    output_path = output_path or Path(__file__).parent / "sample_astronauts.png"
    sim = AstronautSimulator(seed=101)

    fig, axes = plt.subplots(4, 3, figsize=(16, 12), sharex="col")
    astronauts = [
        ("Astro 1 (Early Sleep Collapse, Day 40)", 40),
        ("Astro 2 (Mid-Mission Event, Day 85)", 85),
        ("Astro 3 (Late Disruption, Day 120)", 120),
    ]

    colors = {"sleep": "#38bdf8", "mood": "#a855f7", "hr": "#ef4444", "co2": "#f59e0b"}

    for col_idx, (title, event_day) in enumerate(astronauts):
        astro_id = f"DEMO_{col_idx+1}"
        df, targets = sim.generate_astronaut(astro_id, fixed_event_day=event_day)

        # Row 1: Sleep Hours
        ax1 = axes[0, col_idx]
        ax1.plot(df["day"], df["sleep_hours"], color=colors["sleep"], label="Sleep (hrs)")
        ax1.axhline(df["base_sleep"].iloc[0], color="#94a3b8", linestyle="--", label="Baseline")
        ax1.axvspan(event_day, event_day + df["event_duration"].iloc[0], color="#ef4444", alpha=0.15, label="Anomaly Window")
        ax1.set_title(f"{title}\nLanding Bone: {targets['bone']}% | Muscle: {targets['muscle']}%", fontsize=10, fontweight="bold")
        ax1.set_ylabel("Sleep (hrs)")
        ax1.set_ylim(2.5, 9.5)
        ax1.grid(True, alpha=0.3)
        if col_idx == 0:
            ax1.legend(loc="lower left", fontsize=8)

        # Row 2: Mood Resilience
        ax2 = axes[1, col_idx]
        ax2.plot(df["day"], df["mood"], color=colors["mood"], label="Mood (1-5)")
        ax2.axhline(df["base_mood"].iloc[0], color="#94a3b8", linestyle="--")
        ax2.axvspan(event_day, event_day + df["event_duration"].iloc[0], color="#ef4444", alpha=0.15)
        ax2.set_ylabel("Mood (1-5)")
        ax2.set_ylim(1.0, 5.0)
        ax2.grid(True, alpha=0.3)

        # Row 3: Heart Rate & Resting Drift
        ax3 = axes[2, col_idx]
        ax3.plot(df["day"], df["heart_rate"], color=colors["hr"], label="Heart Rate (bpm)")
        ax3.axhline(df["base_hr"].iloc[0], color="#94a3b8", linestyle="--")
        ax3.axvspan(event_day, event_day + df["event_duration"].iloc[0], color="#ef4444", alpha=0.15)
        ax3.set_ylabel("Heart Rate (bpm)")
        ax3.set_ylim(50, 100)
        ax3.grid(True, alpha=0.3)

        # Row 4: Cabin CO2 Spikes & Cumulative Radiation
        ax4 = axes[3, col_idx]
        ax4.plot(df["day"], df["cabin_co2"], color=colors["co2"], label="CO2 (ppm)")
        ax4.axhline(2800, color="#10b981", linestyle="--", label="Nominal CO2")
        ax4.axhline(4500, color="#ef4444", linestyle=":", label="Ceiling (4500)")
        ax4.axvspan(event_day, event_day + df["event_duration"].iloc[0], color="#ef4444", alpha=0.15)
        ax4.set_xlabel("Mission Day (1 to 180)")
        ax4.set_ylabel("Cabin CO2 (ppm)")
        ax4.set_ylim(2000, 6000)
        ax4.grid(True, alpha=0.3)
        if col_idx == 0:
            ax4.legend(loc="upper left", fontsize=8)

    plt.tight_layout()
    plt.savefig(output_path, dpi=120)
    plt.close()
    print(f"Sample astronauts visualization saved to: {output_path}")


if __name__ == "__main__":
    print("Testing LANDFALL Astronaut Simulator...")
    sim = AstronautSimulator(seed=42)
    demo_df, demo_targets = sim.generate_astronaut("ASTRO_0001", fixed_event_day=40)
    print(f"Generated 180-day telemetry for ASTRO_0001 (shape: {demo_df.shape})")
    print("Ground Truth Landing Readiness Targets (Day 180):")
    for k, v in demo_targets.items():
        print(f"  - {k}: {v}")
    
    # Generate visualization of 3 astronauts with different events
    plot_sample_astronauts()
    print("Simulator test completed successfully.")
