// Demo data shown when no API keys are configured

export const DEMO_QUEST = {
  id: 1,
  week_label: "2026-W17",
  quest_a: {
    zone: "Amsterdam canals",
    city: "Amsterdam",
    lat: 52.375,
    lng: 4.9,
    pollution_type: "floating_plastic",
    satellite_evidence: "FDI max 0.031 — floating plastic confirmed from Sentinel-2. 3 citizen reports with photos in past 14 days.",
    what_to_clean: "Plastic bottles, bags and foam accumulating near Amstel sluice gates. Bring a net or litter picker.",
    urgency: "high",
    citizen_confirmed: true,
  },
  quest_b: {
    zone: "Nieuwe Maas Rotterdam",
    city: "Rotterdam",
    lat: 51.905,
    lng: 4.5,
    pollution_type: "algae_bloom",
    satellite_evidence: "NDCI mean 0.18 — confirmed algae bloom. Turbidity 1.7 indicating recent runoff event.",
    what_to_clean: "Blue-green algae scum along the south bank between Erasmus Bridge and Katendrecht. Skimming nets needed.",
    urgency: "high",
    citizen_confirmed: true,
  },
  satellite_data: [
    {
      zone: "Amsterdam canals",
      ndci_mean: 0.06, fdi_max: 0.031, turbidity_mean: 1.1,
      water_pixels: 820, citizen_reports: 3,
      satellite_view_links: {
        true_colour:   "https://browser.dataspace.copernicus.eu/?zoom=13&lat=52.375&lng=4.9&layerId=1_TRUE_COLOR",
        water_quality: "https://browser.dataspace.copernicus.eu/?zoom=13&lat=52.375&lng=4.9&layerId=4-NDWI",
        algae_ndci:    "https://browser.dataspace.copernicus.eu/?zoom=13&lat=52.375&lng=4.9&layerId=8_NDCI",
        false_colour:  "https://browser.dataspace.copernicus.eu/?zoom=13&lat=52.375&lng=4.9&layerId=2_FALSE_COLOR",
      },
    },
    {
      zone: "Nieuwe Maas Rotterdam",
      ndci_mean: 0.18, fdi_max: 0.008, turbidity_mean: 1.7,
      water_pixels: 1240, citizen_reports: 2,
      satellite_view_links: {
        true_colour:   "https://browser.dataspace.copernicus.eu/?zoom=13&lat=51.905&lng=4.5&layerId=1_TRUE_COLOR",
        water_quality: "https://browser.dataspace.copernicus.eu/?zoom=13&lat=51.905&lng=4.5&layerId=4-NDWI",
        algae_ndci:    "https://browser.dataspace.copernicus.eu/?zoom=13&lat=51.905&lng=4.5&layerId=8_NDCI",
        false_colour:  "https://browser.dataspace.copernicus.eu/?zoom=13&lat=51.905&lng=4.5&layerId=2_FALSE_COLOR",
      },
    },
  ],
  ai_reasoning: "Amsterdam canals selected as Quest A due to highest FDI (0.031) indicating confirmed floating plastic — most cleanable pollution type. Rotterdam Nieuwe Maas selected as Quest B for severe algae bloom (NDCI 0.18, well above 0.15 threshold) combined with turbidity spike from recent runoff. Both zones have high public access and citizen-confirmed ground truth.",
};

export const DEMO_SCORES = {
  A: { team: "A", participant_count: 47, total_points: 2840, kg_removed: 23.5, goal_pct: 56.8 },
  B: { team: "B", participant_count: 31, total_points: 1920, kg_removed: 15.2, goal_pct: 38.4 },
};

export const DEMO_HOTSPOTS = [
  { lat: 52.374, lng: 4.899, photo_count: 8,  intensity: 70, dominant_litter: "plastic_bottles" },
  { lat: 52.377, lng: 4.902, photo_count: 5,  intensity: 45, dominant_litter: "plastic_bags" },
  { lat: 51.906, lng: 4.498, photo_count: 12, intensity: 90, dominant_litter: "algae_bloom" },
  { lat: 51.903, lng: 4.502, photo_count: 4,  intensity: 30, dominant_litter: "foam" },
];

export const DEMO_HISTORY = [DEMO_QUEST];
