import { ExternalLink, Satellite } from "lucide-react";

const LAYER_LABELS = {
  true_colour:   "True Colour",
  water_quality: "Water Quality (NDWI)",
  algae_ndci:    "Algae Index (NDCI)",
  false_colour:  "False Colour",
};

export function SatelliteLink({ links }) {
  if (!links) return null;

  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Satellite className="w-4 h-4 text-ocean" />
        <span className="text-sm font-semibold text-gray-700">View in Copernicus Browser</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(links).map(([key, url]) => (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200
              rounded-lg text-xs text-ocean-dark font-medium hover:bg-ocean-light
              transition-colors min-h-[44px]"
          >
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            {LAYER_LABELS[key] || key}
          </a>
        ))}
      </div>
    </div>
  );
}
