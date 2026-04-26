import urllib.parse
from datetime import datetime


def build_browser_url(
    lat: float,
    lng: float,
    date_str: str,
    layer: str = "1_TRUE_COLOR",
    zoom: int = 13,
) -> str:
    params = {
        "zoom":          zoom,
        "lat":           lat,
        "lng":           lng,
        "themeId":       "DEFAULT-THEME",
        "datasetId":     "S2_L2A_CDAS",
        "fromTime":      f"{date_str}T00:00:00.000Z",
        "toTime":        f"{date_str}T23:59:59.999Z",
        "layerId":       layer,
        "cloudCoverage": 30,
        "dateMode":      "SINGLE",
    }
    return "https://browser.dataspace.copernicus.eu/?" + urllib.parse.urlencode(params)


def get_quest_satellite_links(zone: dict) -> dict:
    bbox  = zone["bbox"]
    lat   = (bbox[1] + bbox[3]) / 2
    lng   = (bbox[0] + bbox[2]) / 2
    today = datetime.now().strftime("%Y-%m-%d")
    return {
        "true_colour":   build_browser_url(lat, lng, today, "1_TRUE_COLOR"),
        "water_quality": build_browser_url(lat, lng, today, "4-NDWI"),
        "algae_ndci":    build_browser_url(lat, lng, today, "8_NDCI"),
        "false_colour":  build_browser_url(lat, lng, today, "2_FALSE_COLOR"),
    }
