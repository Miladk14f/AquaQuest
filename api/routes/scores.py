from fastapi import APIRouter
from api.database import get_db

router = APIRouter(tags=["scores"])


@router.get("/scores/live")
def get_live_scores(quest_id: int | None = None):
    db = get_db()
    query = db.table("team_scores").select("*").order("updated_at", desc=True)
    if quest_id:
        query = query.eq("quest_id", quest_id)
    else:
        # Default: scores for the most recent quest
        latest = (
            db.table("weekly_quests")
            .select("id")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if latest.data:
            query = query.eq("quest_id", latest.data[0]["id"])
    return query.execute().data


@router.get("/scores/history")
def get_score_history(limit: int = 10):
    db = get_db()
    result = (
        db.table("team_scores")
        .select("*, weekly_quests(week_label)")
        .order("updated_at", desc=True)
        .limit(min(limit, 100))
        .execute()
    )
    return result.data
