"""FastAPI application exposing the smartphone usage dataset."""

from typing import Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

import analysis

app = FastAPI(title="Smartphone Usage Analytics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://192.168.1.5:8443",
        "http://localhost:8443",
        "http://127.0.0.1:8443",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "dataset": analysis.DATA_PATH.name}


@app.get("/metadata")
def metadata():
    return analysis.get_metadata()


@app.get("/analytics/overview")
def overview(
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    gender: Optional[str] = Query(None),
    addiction: Optional[str] = Query(None),
    stress_min: Optional[float] = Query(None),
    stress_max: Optional[float] = Query(None),
    max_screen: Optional[float] = Query(None),
):
    df = analysis.filter_data(
        analysis.load_data(),
        age_min=age_min,
        age_max=age_max,
        gender=gender,
        addiction=addiction,
        stress_min=stress_min,
        stress_max=stress_max,
        max_screen=max_screen,
    )
    return analysis.get_overview(df)


@app.get("/analytics/activity-breakdown")
def activity_breakdown(
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    gender: Optional[str] = Query(None),
    addiction: Optional[str] = Query(None),
    stress_min: Optional[float] = Query(None),
    stress_max: Optional[float] = Query(None),
    max_screen: Optional[float] = Query(None),
):
    df = analysis.filter_data(
        analysis.load_data(),
        age_min=age_min,
        age_max=age_max,
        gender=gender,
        addiction=addiction,
        stress_min=stress_min,
        stress_max=stress_max,
        max_screen=max_screen,
    )
    return analysis.get_activity_breakdown(df)


@app.get("/analytics/correlations")
def correlations(
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    gender: Optional[str] = Query(None),
    addiction: Optional[str] = Query(None),
    stress_min: Optional[float] = Query(None),
    stress_max: Optional[float] = Query(None),
    max_screen: Optional[float] = Query(None),
):
    df = analysis.filter_data(
        analysis.load_data(),
        age_min=age_min,
        age_max=age_max,
        gender=gender,
        addiction=addiction,
        stress_min=stress_min,
        stress_max=stress_max,
        max_screen=max_screen,
    )
    return analysis.get_correlations(df)


@app.get("/analytics/demographics")
def demographics(
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    gender: Optional[str] = Query(None),
    addiction: Optional[str] = Query(None),
    stress_min: Optional[float] = Query(None),
    stress_max: Optional[float] = Query(None),
    max_screen: Optional[float] = Query(None),
):
    df = analysis.filter_data(
        analysis.load_data(),
        age_min=age_min,
        age_max=age_max,
        gender=gender,
        addiction=addiction,
        stress_min=stress_min,
        stress_max=stress_max,
        max_screen=max_screen,
    )
    return analysis.get_demographics(df)


@app.get("/analytics/screen-histogram")
def screen_histogram(
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    gender: Optional[str] = Query(None),
    addiction: Optional[str] = Query(None),
    stress_min: Optional[float] = Query(None),
    stress_max: Optional[float] = Query(None),
    max_screen: Optional[float] = Query(None),
):
    df = analysis.filter_data(
        analysis.load_data(),
        age_min=age_min,
        age_max=age_max,
        gender=gender,
        addiction=addiction,
        stress_min=stress_min,
        stress_max=stress_max,
        max_screen=max_screen,
    )
    return analysis.get_screen_histogram(df)


@app.get("/analytics/boxplot")
def boxplot(
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    gender: Optional[str] = Query(None),
    addiction: Optional[str] = Query(None),
    stress_min: Optional[float] = Query(None),
    stress_max: Optional[float] = Query(None),
    max_screen: Optional[float] = Query(None),
):
    df = analysis.filter_data(
        analysis.load_data(),
        age_min=age_min,
        age_max=age_max,
        gender=gender,
        addiction=addiction,
        stress_min=stress_min,
        stress_max=stress_max,
        max_screen=max_screen,
    )
    return analysis.get_boxplot(df)


@app.get("/records")
def records(
    limit: int = Query(100, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    gender: Optional[str] = Query(None),
    addiction: Optional[str] = Query(None),
    stress_min: Optional[float] = Query(None),
    stress_max: Optional[float] = Query(None),
    max_screen: Optional[float] = Query(None),
    country: Optional[str] = Query(None),
    occupation: Optional[str] = Query(None),
    urban_rural: Optional[str] = Query(None),
    device_brand: Optional[str] = Query(None),
):
    return analysis.get_records(
        limit=limit,
        offset=offset,
        age_min=age_min,
        age_max=age_max,
        gender=gender,
        addiction=addiction,
        stress_min=stress_min,
        stress_max=stress_max,
        max_screen=max_screen,
        country=country,
        occupation=occupation,
        urban_rural=urban_rural,
        device_brand=device_brand,
    )
