import requests
from datetime import datetime, timedelta

BASE = "https://waarneming.nl/api/v1"

POLLUTION_KEYWORDS = [
    "blauwgroen", "cyanobacteria", "alg", "drijflaag",
    "plastic", "afval", "troebel", "vervuiling",
    "dode vis", "visdood", "stank",
    "woekering", "invasief",
]

WATER_SPECIES_GROUPS = [7, 12, 14]  # Fish, Plants, Algae


def get_pollution_observations(
    lat: float, lng: float, radius_km: float = 5, days_back: int = 14
) -> dict:
    date_from = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    date_to   = datetime.now().strftime("%Y-%m-%d")
    all_obs   = []

    for group in WATER_SPECIES_GROUPS:
        params = {
            "lat":          lat,
            "lng":          lng,
            "radius":       radius_km * 1000,
            "species_group": group,
            "date_after":   date_from,
            "date_before":  date_to,
            "limit":        100,
        }
        try:
            resp = requests.get(
                f"{BASE}/observations/",
                params=params,
                headers={"Accept-Language": "nl"},
                timeout=10,
            )
            if resp.status_code == 200:
                all_obs.extend(resp.json().get("results", []))
        except Exception as exc:
            print(f"  [waarneming] Group {group} error: {exc}")

    pollution_obs = []
    for obs in all_obs:
        notes = (obs.get("notes", "") + " " + obs.get("species_name", "")).lower()
        if any(kw in notes for kw in POLLUTION_KEYWORDS):
            pollution_obs.append({
                "date":    obs.get("date"),
                "species": obs.get("species_name"),
                "notes":   obs.get("notes", "")[:200],
                "lat":     obs.get("lat"),
                "lng":     obs.get("lng"),
                "photos":  len(obs.get("photos", [])),
            })

    return {
        "total_relevant": len(pollution_obs),
        "observations":   pollution_obs[:10],
        "has_photos":     sum(1 for o in pollution_obs if o["photos"] > 0),
    }
