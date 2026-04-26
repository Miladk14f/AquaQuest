from fastapi import APIRouter, HTTPException
from api.database import get_db

router = APIRouter(tags=["quests"])


@router.get("/quests/current")
def get_current_quest():
    db = get_db()
    result = (
        db.table("weekly_quests")
        .select("*")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No active quest found")
    return result.data[0]


@router.get("/quests/history")
def get_quest_history(limit: int = 10):
    db = get_db()
    result = (
        db.table("weekly_quests")
        .select("id, week_label, quest_a, quest_b, created_at")
        .order("created_at", desc=True)
        .limit(min(limit, 52))
        .execute()
    )
    return result.data


@router.get("/quests/{quest_id}")
def get_quest(quest_id: int):
    db = get_db()
    result = db.table("weekly_quests").select("*").eq("id", quest_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Quest not found")
    return result.data[0]


@router.get("/satellite-readings")
def get_satellite_readings(week_label: str | None = None, limit: int = 20):
    db = get_db()
    query = db.table("satellite_readings").select("*").order("created_at", desc=True)
    if week_label:
        query = query.eq("week_label", week_label)
    return query.limit(limit).execute().data
