from dotenv import load_dotenv
load_dotenv()

from pipeline.sentinel_fetch     import collect_all_zones, WATERWAYS
from pipeline.waarneming_fetch   import get_pollution_observations
from pipeline.copernicus_browser import get_quest_satellite_links
from pipeline.agent_analysis     import analyse_and_select_quests
from datetime import datetime
import json
import os

try:
    from supabase import create_client
    _supabase = create_client(
        os.environ.get("SUPABASE_URL", ""),
        os.environ.get("SUPABASE_SERVICE_KEY", ""),
    )
except Exception:
    _supabase = None


def build_enriched_zone(zone_sat_data: dict) -> dict:
    lat = zone_sat_data["lat"]
    lng = zone_sat_data["lng"]

    citizen = get_pollution_observations(lat, lng, radius_km=5, days_back=14)

    # Build the bbox from zone sat data to generate satellite view links
    bbox = [lng - 0.05, lat - 0.025, lng + 0.05, lat + 0.025]
    links = get_quest_satellite_links({"name": zone_sat_data["zone"], "bbox": bbox})

    return {
        **zone_sat_data,
        "citizen_reports":      citizen["total_relevant"],
        "citizen_confirmed":    citizen["has_photos"] > 0,
        "citizen_notes":        [o["notes"] for o in citizen["observations"][:3]],
        "satellite_view_links": links,
    }


def save_to_supabase(quest: dict, enriched: list) -> int | None:
    if not _supabase:
        print("  [db] Supabase not configured — skipping save")
        return None

    week = datetime.now().strftime("%Y-W%W")
    try:
        result = _supabase.table("weekly_quests").insert({
            "week_label":     week,
            "quest_a":        quest["quest_a"],
            "quest_b":        quest["quest_b"],
            "satellite_data": enriched,
            "ai_reasoning":   quest.get("reasoning", ""),
        }).execute()
        quest_id = result.data[0]["id"]

        # Seed team_scores rows for A and B
        _supabase.table("team_scores").insert([
            {"quest_id": quest_id, "team": "A"},
            {"quest_id": quest_id, "team": "B"},
        ]).execute()

        # Save satellite readings
        week_label = week
        readings = []
        for z in enriched:
            readings.append({
                "zone_name":        z["zone"],
                "week_label":       week_label,
                "ndci_mean":        z["ndci_mean"],
                "fdi_max":          z["fdi_max"],
                "turbidity_mean":   z["turbidity_mean"],
                "water_pixels":     z["water_pixels"],
                "citizen_reports":  z["citizen_reports"],
                "citizen_confirmed": z["citizen_confirmed"],
                "satellite_links":  z.get("satellite_view_links"),
                "reading_date":     z["date"],
            })
        _supabase.table("satellite_readings").insert(readings).execute()

        print(f"  [db] Saved quest ID {quest_id} and {len(readings)} satellite readings")
        return quest_id
    except Exception as exc:
        print(f"  [db] Save error: {exc}")
        return None


def run_weekly_pipeline() -> dict | None:
    print("=" * 60)
    print(f"WaterQuest Weekly Pipeline — {datetime.now().isoformat()}")
    print("=" * 60)

    print("\nStep 1: Fetching Sentinel-2 satellite data...")
    sat_data = collect_all_zones()
    if not sat_data:
        print("ERROR: No satellite data returned. All zones may be cloudy. Aborting.")
        return None
    print(f"  Got data for {len(sat_data)} zones")

    print("\nStep 2: Enriching zones with Waarneming.nl citizen data...")
    enriched = [build_enriched_zone(z) for z in sat_data]

    print("\nStep 3: Sending enriched data to DeepSeek AI for quest selection...")
    # Fetch recent zones to avoid repeating them
    recent_zones = []
    if _supabase:
        try:
            rows = _supabase.table("weekly_quests") \
                .select("quest_a, quest_b") \
                .order("created_at", desc=True) \
                .limit(1) \
                .execute()
            for row in rows.data:
                if row.get("quest_a"): recent_zones.append(row["quest_a"].get("zone"))
                if row.get("quest_b"): recent_zones.append(row["quest_b"].get("zone"))
            recent_zones = [z for z in recent_zones if z]
            if recent_zones:
                print(f"  Recent zones to avoid: {recent_zones}")
        except Exception as e:
            print(f"  [db] Could not fetch recent zones: {e}")
    quest = analyse_and_select_quests(enriched, recent_zones=recent_zones)

    print(f"\nStep 4: Quest selected:")
    print(f"  Quest A → {quest['quest_a']['zone']} ({quest['quest_a']['city']})")
    print(f"  Quest B → {quest['quest_b']['zone']} ({quest['quest_b']['city']})")

    print("\nStep 5: Saving to Supabase...")
    quest_id = save_to_supabase(quest, enriched)
    if quest_id:
        print(f"  Quests are now live (quest_id={quest_id})")

    print("\nPipeline complete.")
    print(f"Week summary: {quest.get('week_summary', '')}")
    return quest


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    result = run_weekly_pipeline()
    if result:
        print("\n" + json.dumps(result, indent=2))
