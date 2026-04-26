import { useEffect, useRef, useState } from "react";
import L from "leaflet";

// Fix default Leaflet marker icons for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const NL_CENTER = [52.37, 5.1];

function makeQuestIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,.4);
      animation:pulse 2s infinite;
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export function MapView({ quest, hotspots = [], height = "h-[400px] md:h-[500px]" }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const [layers, setLayers] = useState({ quests: true, hotspots: true });

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: NL_CENTER,
      zoom:   8,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Quest markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !quest) return;

    const markers = [];

    const addQuestMarker = (q, color, label) => {
      if (!q?.lat || !q?.lng) return;
      const m = L.marker([q.lat, q.lng], { icon: makeQuestIcon(color) })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:200px">
            <strong>${label}: ${q.zone}</strong><br/>
            <small>${q.city}</small><br/>
            <span style="color:#666;font-size:12px">${q.what_to_clean || ""}</span>
          </div>
        `);
      markers.push(m);

      // Zone circle
      const circle = L.circle([q.lat, q.lng], {
        radius: 500,
        color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);
      markers.push(circle);
    };

    if (layers.quests) {
      addQuestMarker(quest.quest_a, "#1D9E75", "Quest A");
      addQuestMarker(quest.quest_b, "#D85A30", "Quest B");
    }

    return () => markers.forEach(m => m.remove());
  }, [quest, layers.quests]);

  // Hotspot heatmap (simple circle markers)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hotspots.length || !layers.hotspots) return;

    const circles = hotspots.map(h =>
      L.circleMarker([h.lat, h.lng], {
        radius:      Math.max(8, h.intensity / 10),
        color:       "#EF9F27",
        fillColor:   "#EF9F27",
        fillOpacity: 0.5,
        weight:      1,
      })
        .addTo(map)
        .bindPopup(`${h.dominant_litter} — ${h.photo_count} photos`)
    );

    return () => circles.forEach(c => c.remove());
  }, [hotspots, layers.hotspots]);

  return (
    <div className="relative">
      {/* Layer toggles */}
      <div className="absolute top-3 right-3 z-[500] flex flex-col gap-1">
        {[
          { key: "quests",   label: "Quest Zones" },
          { key: "hotspots", label: "Photo Hotspots" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setLayers(p => ({ ...p, [key]: !p[key] }))}
            className={`text-xs px-2 py-1 rounded-lg font-medium shadow border transition-colors
              ${layers[key]
                ? "bg-white text-gray-800 border-gray-200"
                : "bg-gray-200 text-gray-500 border-transparent"}`}
          >
            {layers[key] ? "✓" : "○"} {label}
          </button>
        ))}
      </div>

      <div ref={containerRef} className={`w-full ${height} rounded-2xl overflow-hidden z-0`} />
    </div>
  );
}
