import numpy as np
import os
from sentinelhub import (
    SHConfig, SentinelHubRequest, DataCollection,
    BBox, CRS, MimeType, bbox_to_dimensions,
)
from datetime import datetime, timedelta

EVALSCRIPT = """
//VERSION=3
function setup() {
  return {
    input:  [{bands: ["B03","B04","B05","B06","B08","B8A","B11","SCL"]}],
    output: {bands: 5, sampleType: "FLOAT32"}
  };
}
function evaluatePixel(s) {
  // Mask clouds (SCL: 8=cloud medium, 9=cloud high, 10=thin cirrus)
  if ([8,9,10].includes(s.SCL)) return [0,0,0,0,0];
  var ndwi = (s.B03 - s.B08) / (s.B03 + s.B08 + 1e-10);
  var w    = ndwi > 0.1 ? 1 : 0;
  var ndci = (s.B05 - s.B04) / (s.B05 + s.B04 + 1e-10);
  var turb = s.B04 / (s.B03 + 1e-10);
  var fdi  = s.B08 - (s.B06 + (s.B11 - s.B06) * ((833.0 - 740.0) / (1610.0 - 740.0)));
  return [ndci * w, turb * w, fdi * w, ndwi, w];
}
"""

WATERWAYS = [
    {"name": "Amsterdam canals",      "bbox": [4.85, 52.35, 4.95, 52.40], "access": "high"},
    {"name": "Nieuwe Maas Rotterdam", "bbox": [4.45, 51.88, 4.55, 51.93], "access": "high"},
    {"name": "Waal Nijmegen",         "bbox": [5.82, 51.83, 5.95, 51.88], "access": "medium"},
    {"name": "IJssel Zutphen",        "bbox": [6.17, 52.12, 6.25, 52.17], "access": "medium"},
    {"name": "Markermeer shore",      "bbox": [5.05, 52.40, 5.20, 52.52], "access": "medium"},
    {"name": "Maas Den Bosch",        "bbox": [5.28, 51.67, 5.40, 51.72], "access": "high"},
]


def get_config() -> SHConfig:
    config = SHConfig()
    config.sh_client_id     = os.environ["COPERNICUS_CLIENT_ID"]
    config.sh_client_secret = os.environ["COPERNICUS_CLIENT_SECRET"]
    config.sh_base_url  = "https://sh.dataspace.copernicus.eu"
    config.sh_token_url = (
        "https://identity.dataspace.copernicus.eu"
        "/auth/realms/CDSE/protocol/openid-connect/token"
    )
    return config


def get_water_quality(zone: dict, config: SHConfig) -> dict | None:
    bbox  = BBox(bbox=zone["bbox"], crs=CRS.WGS84)
    size  = bbox_to_dimensions(bbox, resolution=20)
    today = datetime.now()

    req = SentinelHubRequest(
        evalscript=EVALSCRIPT,
        input_data=[SentinelHubRequest.input_data(
            data_collection=DataCollection.SENTINEL2_L2A.define_from(
                "S2", service_url=config.sh_base_url
            ),
            time_interval=(
                (today - timedelta(days=7)).strftime("%Y-%m-%d"),
                today.strftime("%Y-%m-%d"),
            ),
            mosaicking_order="leastCC",
        )],
        responses=[SentinelHubRequest.output_response("default", MimeType.TIFF)],
        bbox=bbox,
        size=size,
        config=config,
    )

    try:
        data = req.get_data()[0]
    except Exception as exc:
        print(f"  [sentinel] Error fetching {zone['name']}: {exc}")
        return None

    ndci, turb, fdi, _ndwi, wmask = [data[..., i] for i in range(5)]
    wp = wmask > 0.5

    if wp.sum() < 50:
        print(f"  [sentinel] {zone['name']}: only {int(wp.sum())} water pixels — skipping")
        return None

    return {
        "zone":           zone["name"],
        "access":         zone["access"],
        "ndci_mean":      round(float(np.nanmedian(ndci[wp])), 4),
        "turbidity_mean": round(float(np.nanmedian(turb[wp])), 4),
        "fdi_max":        round(float(np.nanpercentile(fdi[wp], 95)), 4),
        "water_pixels":   int(wp.sum()),
        "lat":            (zone["bbox"][1] + zone["bbox"][3]) / 2,
        "lng":            (zone["bbox"][0] + zone["bbox"][2]) / 2,
        "date":           today.strftime("%Y-%m-%d"),
    }


def collect_all_zones() -> list[dict]:
    cfg = get_config()
    results = []
    for zone in WATERWAYS:
        print(f"  [sentinel] Fetching {zone['name']}...")
        result = get_water_quality(zone, cfg)
        if result:
            results.append(result)
    return results
