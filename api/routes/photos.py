from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pipeline.photo_pipeline import classify_photo, calculate_points
from api.database import get_db
import os

router = APIRouter(tags=["photos"])

MAX_PHOTO_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/photos/upload")
async def upload_photo(
    photo:    UploadFile = File(...),
    gps_lat:  float      = Form(...),
    gps_lng:  float      = Form(...),
    quest_id: int        = Form(...),
    team:     str        = Form(...),
    user_id:  str        = Form(default="anonymous"),
):
    if team not in ("A", "B"):
        raise HTTPException(status_code=400, detail="team must be 'A' or 'B'")

    # Validate latitude/longitude bounds for the Netherlands
    if not (50.5 <= gps_lat <= 53.7 and 3.0 <= gps_lng <= 7.5):
        raise HTTPException(
            status_code=400,
            detail="GPS coordinates must be within the Netherlands",
        )

    image_bytes = await photo.read()
    if len(image_bytes) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=413, detail="Photo exceeds 10 MB limit")

    # AI classification
    result = classify_photo(image_bytes, gps_lat, gps_lng)
    points = calculate_points(result)

    # Upload photo to Supabase Storage
    photo_url = None
    try:
        db = get_db()
        filename = f"{quest_id}/{team}/{user_id}_{int(gps_lat*1e5)}_{int(gps_lng*1e5)}.jpg"
        db.storage.from_("pollution-photos").upload(
            filename, image_bytes, {"content-type": "image/jpeg"}
        )
        photo_url = (
            f"{os.environ['SUPABASE_URL']}/storage/v1/object/public/pollution-photos/{filename}"
        )
    except Exception as exc:
        print(f"  [photos] Storage upload error: {exc}")

    # Save to database
    try:
        db = get_db()
        db.table("pollution_photos").insert({
            "quest_id":   quest_id,
            "user_id":    user_id,
            "team":       team,
            "gps_lat":    gps_lat,
            "gps_lng":    gps_lng,
            "litter_type": result.get("litter_type"),
            "severity":   result.get("severity"),
            "item_count": result.get("item_count_estimate", 0),
            "confidence": result.get("confidence"),
            "is_valid":   result.get("is_valid_pollution", False),
            "points":     points,
            "photo_url":  photo_url,
        }).execute()

        if result.get("is_valid_pollution") and points > 0:
            _update_team_score(db, quest_id, team, points)
    except Exception as exc:
        print(f"  [photos] DB save error: {exc}")

    return {
        **result,
        "points":     points,
        "photo_url":  photo_url,
    }


def _update_team_score(db, quest_id: int, team: str, points: int) -> None:
    existing = (
        db.table("team_scores")
        .select("*")
        .eq("quest_id", quest_id)
        .eq("team", team)
        .execute()
    )
    if existing.data:
        row = existing.data[0]
        new_pts = row["total_points"] + points
        new_kg  = row["kg_removed"] + 0.1  # ~100g per item found
        db.table("team_scores").update({
            "total_points": new_pts,
            "kg_removed":   round(new_kg, 1),
            "goal_pct":     min(100, round(new_pts / 50, 1)),  # goal = 5000 pts
            "participant_count": row["participant_count"] + 1,
        }).eq("id", row["id"]).execute()
    else:
        db.table("team_scores").insert({
            "quest_id":         quest_id,
            "team":             team,
            "total_points":     points,
            "kg_removed":       0.1,
            "goal_pct":         round(points / 50, 1),
            "participant_count": 1,
        }).execute()


@router.get("/photos/hotspots")
def get_hotspots(quest_id: int):
    from pipeline.photo_pipeline import build_hotspot_heatmap
    db = get_db()
    result = (
        db.table("pollution_photos")
        .select("gps_lat,gps_lng,litter_type,severity,is_valid")
        .eq("quest_id", quest_id)
        .eq("is_valid", True)
        .execute()
    )
    return build_hotspot_heatmap(result.data)
