"""Data loading and analytics helpers for the smartphone usage dataset."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

import math
import pandas as pd

DATA_PATH = Path(__file__).resolve().parent / "data" / "mobile_addiction_data.csv"

COLUMN_MAP = {
    "User_ID": "userId",
    "Country": "country",
    "Age": "age",
    "Gender": "gender",
    "Occupation": "occupation",
    "Education_Level": "education",
    "Income_USD": "income",
    "Daily_Screen_Time_Hours": "screenTime",
    "Phone_Unlocks_Per_Day": "phoneUnlocks",
    "Social_Media_Usage_Hours": "socialMedia",
    "Gaming_Usage_Hours": "gaming",
    "Streaming_Usage_Hours": "streaming",
    "Messaging_Usage_Hours": "messaging",
    "Work_Related_Usage_Hours": "work",
    "Sleep_Hours": "sleep",
    "Physical_Activity_Hours": "physicalActivity",
    "Mental_Health_Score": "mentalHealth",
    "Depression_Score": "depression",
    "Anxiety_Score": "anxiety",
    "Stress_Level": "stress",
    "Relationship_Status": "relationshipStatus",
    "Has_Children": "hasChildren",
    "Urban_or_Rural": "urbanRural",
    "Time_Spent_With_Family_Hours": "familyTime",
    "Online_Shopping_Hours": "onlineShopping",
    "Internet_Connection_Type": "internetType",
    "Primary_Device_Brand": "deviceBrand",
    "Has_Screen_Time_Management_App": "hasScreenTimeApp",
    "Self_Reported_Addiction_Level": "addiction",
    "Monthly_Data_Usage_GB": "monthlyDataUsage",
    "Has_Night_Mode_On": "hasNightMode",
    "Age_First_Phone": "ageFirstPhone",
    "Push_Notifications_Per_Day": "pushNotifications",
    "Tech_Savviness_Score": "techSavviness",
}

NUMERIC_COLUMNS = [
    "Age", "Income_USD", "Daily_Screen_Time_Hours", "Phone_Unlocks_Per_Day",
    "Social_Media_Usage_Hours", "Gaming_Usage_Hours", "Streaming_Usage_Hours",
    "Messaging_Usage_Hours", "Work_Related_Usage_Hours", "Sleep_Hours",
    "Physical_Activity_Hours", "Mental_Health_Score", "Depression_Score",
    "Anxiety_Score", "Stress_Level", "Time_Spent_With_Family_Hours",
    "Online_Shopping_Hours", "Monthly_Data_Usage_GB", "Age_First_Phone",
    "Push_Notifications_Per_Day", "Tech_Savviness_Score",
]

_df_cache = None


def load_data():
    global _df_cache
    if _df_cache is None:
        _df_cache = pd.read_csv(DATA_PATH)
    return _df_cache.copy()


def _clean_value(value):
    if isinstance(value, float) and math.isnan(value):
        return None
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            pass
    return value


def _to_records(df):
    records = []
    for row in df.to_dict(orient="records"):
        record = {}
        for raw_col, norm_key in COLUMN_MAP.items():
            v = row.get(raw_col)
            if isinstance(v, float) and math.isnan(v):
                v = None
            elif hasattr(v, "item"):
                try:
                    v = v.item()
                except Exception:
                    pass
            record[norm_key] = v
        records.append(record)
    return records


def _corr(series_a, series_b):
    a = pd.to_numeric(series_a, errors="coerce")
    b = pd.to_numeric(series_b, errors="coerce")
    mask = a.notna() & b.notna()
    a = a[mask]
    b = b[mask]
    if len(a) < 2:
        return 0.0
    ma = a.mean()
    mb = b.mean()
    numerator = ((a - ma) * (b - mb)).sum()
    denominator = math.sqrt(((a - ma) ** 2).sum() * ((b - mb) ** 2).sum())
    if denominator == 0:
        return 0.0
    return float(numerator / denominator)


def filter_data(df, age_min=None, age_max=None, gender=None, addiction=None,
                stress_min=None, stress_max=None, max_screen=None,
                country=None, occupation=None, urban_rural=None, device_brand=None):
    out = df.copy()
    if age_min is not None:
        out = out[out["Age"] >= age_min]
    if age_max is not None:
        out = out[out["Age"] <= age_max]
    if gender:
        out = out[out["Gender"].astype(str).str.lower() == gender.lower()]
    if addiction:
        out = out[out["Self_Reported_Addiction_Level"].astype(str).str.lower() == addiction.lower()]
    if stress_min is not None:
        out = out[out["Stress_Level"] >= stress_min]
    if stress_max is not None:
        out = out[out["Stress_Level"] <= stress_max]
    if max_screen is not None:
        out = out[out["Daily_Screen_Time_Hours"] <= max_screen]
    if country:
        out = out[out["Country"].astype(str).str.lower() == country.lower()]
    if occupation:
        out = out[out["Occupation"].astype(str).str.lower() == occupation.lower()]
    if urban_rural:
        out = out[out["Urban_or_Rural"].astype(str).str.lower() == urban_rural.lower()]
    if device_brand:
        out = out[out["Primary_Device_Brand"].astype(str).str.lower() == device_brand.lower()]
    return out
def get_metadata():
    df = load_data()
    missing = {col: int(df[col].isna().sum()) for col in df.columns}
    ranges = {}
    for col in NUMERIC_COLUMNS:
        if col in df.columns:
            ranges[col] = {
                "min": _clean_value(df[col].min()),
                "max": _clean_value(df[col].max()),
                "mean": _clean_value(df[col].mean()),
            }
    return {
        "dataset": DATA_PATH.name,
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "missing_values": missing,
        "missing_total": int(df.isna().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum()),
        "column_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "numeric_ranges": ranges,
        "age_min": int(df["Age"].min()),
        "age_max": int(df["Age"].max()),
        "gender_counts": {str(k): int(v) for k, v in df["Gender"].value_counts().items()},
        "addiction_counts": {str(k): int(v) for k, v in df["Self_Reported_Addiction_Level"].value_counts().items()},
        "countries": sorted(df["Country"].dropna().astype(str).unique().tolist()),
        "occupations": sorted(df["Occupation"].dropna().astype(str).unique().tolist()),
        "device_brands": sorted(df["Primary_Device_Brand"].dropna().astype(str).unique().tolist()),
    }


def get_overview(df=None):
    if df is None:
        df = load_data()
    n = len(df)
    addiction_counts = {str(k): int(v) for k, v in df["Self_Reported_Addiction_Level"].value_counts().items()}
    high_like = int(df["Self_Reported_Addiction_Level"].isin(["High", "Severe"]).sum())
    return {
        "total_records": n,
        "average_screen_time": _clean_value(df["Daily_Screen_Time_Hours"].mean()) if n else None,
        "average_sleep": _clean_value(df["Sleep_Hours"].mean()) if n else None,
        "average_stress": _clean_value(df["Stress_Level"].mean()) if n else None,
        "average_physical_activity": _clean_value(df["Physical_Activity_Hours"].mean()) if n else None,
        "average_push_notifications": _clean_value(df["Push_Notifications_Per_Day"].mean()) if n else None,
        "high_addiction_count": high_like,
        "high_addiction_percent": (high_like / n * 100) if n else 0.0,
        "addiction_counts": addiction_counts,
        "correlation_screen_sleep": _corr(df["Daily_Screen_Time_Hours"], df["Sleep_Hours"]),
    }


def get_activity_breakdown(df=None):
    if df is None:
        df = load_data()
    if len(df) == 0:
        return []
    activities = [
        ("Social media", "Social_Media_Usage_Hours", "#168C87"),
        ("Gaming", "Gaming_Usage_Hours", "#D9A441"),
        ("Streaming", "Streaming_Usage_Hours", "#70A47B"),
        ("Messaging", "Messaging_Usage_Hours", "#DD775F"),
        ("Work related", "Work_Related_Usage_Hours", "#172033"),
    ]
    result = []
    for name, col, fill in activities:
        result.append({"name": name, "hours": _clean_value(df[col].mean()), "fill": fill})
    tracked = df[["Social_Media_Usage_Hours", "Gaming_Usage_Hours", "Streaming_Usage_Hours", "Messaging_Usage_Hours", "Work_Related_Usage_Hours"]].sum(axis=1)
    other = (df["Daily_Screen_Time_Hours"] - tracked).clip(lower=0)
    result.append({"name": "Other apps", "hours": _clean_value(other.mean()), "fill": "#768196"})
    return result

def get_correlations(df=None):
    if df is None:
        df = load_data()
    pairs = [
        ("Sleep duration", "Sleep_Hours"),
        ("Stress level", "Stress_Level"),
        ("Physical activity", "Physical_Activity_Hours"),
        ("Push notifications", "Push_Notifications_Per_Day"),
        ("Phone unlocks", "Phone_Unlocks_Per_Day"),
        ("Monthly data usage", "Monthly_Data_Usage_GB"),
        ("Age", "Age"),
        ("Mental health score", "Mental_Health_Score"),
        ("Anxiety score", "Anxiety_Score"),
        ("Depression score", "Depression_Score"),
        ("Tech savviness", "Tech_Savviness_Score"),
        ("Family time", "Time_Spent_With_Family_Hours"),
    ]
    result = []
    for name, col in pairs:
        if col in df.columns:
            result.append({"name": name, "key": col, "r": _corr(df["Daily_Screen_Time_Hours"], df[col])})
    return result


def get_records(limit=100, offset=0, age_min=None, age_max=None, gender=None,
                addiction=None, stress_min=None, stress_max=None, max_screen=None,
                country=None, occupation=None, urban_rural=None, device_brand=None):
    df = load_data()
    filtered = filter_data(df, age_min=age_min, age_max=age_max, gender=gender,
                           addiction=addiction, stress_min=stress_min, stress_max=stress_max,
                           max_screen=max_screen, country=country, occupation=occupation,
                           urban_rural=urban_rural, device_brand=device_brand)
    total = len(filtered)
    page = filtered.iloc[offset: offset + limit]
    return {"total": int(total), "limit": int(limit), "offset": int(offset), "records": _to_records(page)}


def get_demographics(df=None):
    if df is None:
        df = load_data()
    groups = []
    bins = [(12, 17), (18, 24), (25, 34), (35, 44), (45, 54), (55, 70)]
    for lo, hi in bins:
        subset = df[(df["Age"] >= lo) & (df["Age"] <= hi)]
        groups.append({
            "group": f"{lo}-{hi}",
            "screen": _clean_value(subset["Daily_Screen_Time_Hours"].mean()) if len(subset) else None,
            "sleep": _clean_value(subset["Sleep_Hours"].mean()) if len(subset) else None,
            "count": int(len(subset)),
        })
    return groups


def get_screen_histogram(df=None, bin_size=1.0):
    if df is None:
        df = load_data()
    if len(df) == 0:
        return []
    s = df["Daily_Screen_Time_Hours"]
    lo = math.floor(float(s.min()))
    hi = math.ceil(float(s.max()))
    bins = []
    cur = lo
    while cur < hi:
        nxt = cur + bin_size
        count = int(((s >= cur) & (s < nxt)).sum())
        bins.append({"bin": f"{cur}-{nxt}", "count": count})
        cur = nxt
    return bins


def get_boxplot(df=None):
    if df is None:
        df = load_data()
    result = []
    for category in ["Low", "Moderate", "High", "Severe"]:
        values = df[df["Self_Reported_Addiction_Level"] == category]["Daily_Screen_Time_Hours"].dropna()
        if len(values) == 0:
            result.append({"category": category, "min": None, "q1": None, "median": None, "q3": None, "max": None, "count": 0})
            continue
        sorted_v = values.sort_values()
        result.append({
            "category": category,
            "min": _clean_value(sorted_v.min()),
            "q1": _clean_value(sorted_v.quantile(0.25)),
            "median": _clean_value(sorted_v.median()),
            "q3": _clean_value(sorted_v.quantile(0.75)),
            "max": _clean_value(sorted_v.max()),
            "count": int(len(values)),
        })
    return result
