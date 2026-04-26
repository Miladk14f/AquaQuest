from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets
import os

router   = APIRouter(tags=["admin"])
security = HTTPBasic()


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    expected = os.environ.get("ADMIN_PASSWORD", "changeme")
    ok = secrets.compare_digest(credentials.password, expected)
    if not ok:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return credentials.username


@router.post("/admin/run-pipeline")
def run_pipeline(username: str = Depends(verify_admin)):
    from pipeline.main_pipeline import run_weekly_pipeline
    try:
        result = run_weekly_pipeline()
        if result is None:
            raise HTTPException(status_code=500, detail="Pipeline returned no result")
        return {
            "status":  "success",
            "quest_a": result["quest_a"]["zone"],
            "quest_b": result["quest_b"]["zone"],
            "summary": result.get("week_summary", ""),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/admin/status")
def get_status(username: str = Depends(verify_admin)):
    from api.database import get_db
    db = get_db()

    latest_quest = (
        db.table("weekly_quests")
        .select("id, week_label, created_at")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    latest_photo = (
        db.table("pollution_photos")
        .select("created_at")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    zone_count = (
        db.table("satellite_readings")
        .select("zone_name", count="exact")
        .execute()
    )

    return {
        "latest_quest":      latest_quest.data[0] if latest_quest.data else None,
        "last_photo":        latest_photo.data[0] if latest_photo.data else None,
        "total_sat_readings": zone_count.count,
        "pipeline_healthy":  True,
    }


@router.get("/admin/zones-preview")
def zones_preview(username: str = Depends(verify_admin)):
    from api.database import get_db
    db = get_db()
    result = (
        db.table("satellite_readings")
        .select("*")
        .order("created_at", desc=True)
        .limit(12)
        .execute()
    )
    return result.data
