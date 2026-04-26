from openai import OpenAI
from sklearn.cluster import DBSCAN
import numpy as np
import json
import base64
import os

PHOTO_PROMPT = """Analyse this photo for water or riverbank pollution in the Netherlands.
The photo was taken by a citizen at a WaterQuest cleanup location.

Return ONLY valid JSON, no other text:
{
  "is_valid_pollution": true or false,
  "litter_type": "plastic_bottles|plastic_bags|foam|rope|organic|mixed|algae_bloom|none",
  "severity": "low|medium|high",
  "item_count_estimate": integer 0-100,
  "is_water_surface": true or false,
  "confidence": 0.0 to 1.0,
  "cleanable_by_hand": true or false,
  "rejection_reason": null or "not_water|no_litter|blurry|indoor|irrelevant"
}

Rules:
- Reject (is_valid_pollution: false) if no visible pollution or clearly not near water
- is_water_surface = true only if litter is ON the water surface
- cleanable_by_hand = false only for heavy submerged or embedded items
- If in doubt about context, still classify the litter type"""


def get_client() -> OpenAI:
    return OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.environ["NVIDIA_API_KEY"],
    )


def classify_photo(image_bytes: bytes, gps_lat: float, gps_lng: float) -> dict:
    client  = get_client()
    img_b64 = base64.b64encode(image_bytes).decode()

    try:
        response = client.chat.completions.create(
            model="deepseek-ai/deepseek-v4-pro",
            messages=[{"role": "user", "content": [
                {"type": "image_url",
                 "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}},
                {"type": "text", "text": PHOTO_PROMPT},
            ]}],
            max_tokens=300,
            temperature=0.1,
            stream=False,
        )
        raw = response.choices[0].message.content
        result = json.loads(raw)
        result["gps_lat"] = gps_lat
        result["gps_lng"] = gps_lng
        return result
    except json.JSONDecodeError:
        return {"is_valid_pollution": False, "rejection_reason": "parse_error",
                "gps_lat": gps_lat, "gps_lng": gps_lng}
    except Exception as exc:
        print(f"  [photo] Classification error: {exc}")
        return {"is_valid_pollution": False, "rejection_reason": "api_error",
                "gps_lat": gps_lat, "gps_lng": gps_lng}


def calculate_points(result: dict) -> int:
    if not result.get("is_valid_pollution"):
        return 0
    severity_pts = {"low": 15, "medium": 20, "high": 30}
    pts = severity_pts.get(result.get("severity", "low"), 15)
    if result.get("confidence", 0) > 0.8:
        pts += 5
    return pts


def build_hotspot_heatmap(validated_photos: list) -> list:
    valid = [p for p in validated_photos if p.get("is_valid_pollution")]
    if len(valid) < 3:
        return []

    coords = np.array([[p["gps_lat"], p["gps_lng"]] for p in valid])
    # ~30 m radius clustering
    db = DBSCAN(eps=0.0003, min_samples=2).fit(coords)

    severity_score = {"low": 1, "medium": 2, "high": 3}
    hotspots = []

    for label in set(db.labels_):
        if label == -1:
            continue
        cluster = [valid[i] for i, lbl in enumerate(db.labels_) if lbl == label]
        score   = sum(severity_score.get(p.get("severity", "low"), 1) for p in cluster)

        litter_types = [p.get("litter_type", "mixed") for p in cluster]
        dominant = max(set(litter_types), key=litter_types.count)

        hotspots.append({
            "lat":             float(np.mean([p["gps_lat"] for p in cluster])),
            "lng":             float(np.mean([p["gps_lng"] for p in cluster])),
            "photo_count":     len(cluster),
            "intensity":       min(100, score * 10),
            "dominant_litter": dominant,
        })

    return sorted(hotspots, key=lambda h: h["intensity"], reverse=True)
