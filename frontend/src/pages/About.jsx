import { Satellite, BookOpen, HelpCircle, Shield } from "lucide-react";

const INDICES = [
  { name: "NDCI",      formula: "(B5 − B4) / (B5 + B4)",                       detects: "Algae / chlorophyll-a",    threshold: ">0.05 concern · >0.15 bloom" },
  { name: "FDI",       formula: "B8 − (B6 + (B11−B6) × factor)",               detects: "Floating plastic / litter", threshold: ">0.02 = confirmed from space" },
  { name: "Turbidity", formula: "B4 / B3",                                       detects: "Sediment / runoff",         threshold: ">1.5 = heavy contamination" },
  { name: "NDWI",      formula: "(B3 − B8) / (B3 + B8)",                       detects: "Water pixels mask",         threshold: ">0.1 = water" },
  { name: "NDMI",      formula: "(B8 − B11) / (B8 + B11)",                     detects: "Crop water stress",         threshold: "Upstream irrigation runoff" },
  { name: "BSI",       formula: "(B11+B4−B8−B2) / (B11+B4+B8+B2)",            detects: "Bare soil / erosion",       threshold: "Pre-runoff indicator" },
];

const DATA_SOURCES = [
  { name: "Sentinel-2 (Copernicus)", res: "10m optical",  use: "FDI, NDCI, Turbidity, NDWI", access: "Free" },
  { name: "Sentinel-1 (Copernicus)", res: "20m SAR radar",use: "Flood mapping, cloud-free",   access: "Free" },
  { name: "Sentinel-3 (Copernicus)", res: "300m",          use: "Sea temp, large algae",       access: "Free" },
  { name: "CLMS Land Monitoring",    res: "1km / 300m",    use: "Soil Water Index",            access: "Free" },
  { name: "Waarneming.nl API",       res: "GPS points",    use: "Citizen pollution reports",   access: "Free REST" },
];

const FAQS = [
  {
    q: "How are quest zones selected?",
    a: "Every Monday at 07:00 UTC, an automated GitHub Actions pipeline fetches Sentinel-2 satellite data for 6 Netherlands waterway zones. It computes algae (NDCI), floating plastic (FDI), and turbidity indices, then enriches each zone with Waarneming.nl citizen reports. All data is sent to the DeepSeek-V4-Pro AI, which selects the 2 most impactful, human-cleanable locations based on strict rules.",
  },
  {
    q: "Is the satellite data real?",
    a: "Yes. WaterQuest uses Copernicus Sentinel-2 Level-2A data from the European Space Agency, processed via the official Copernicus Data Space. The spectral indices (NDCI, FDI, Turbidity) are calculated from real multispectral imagery — not simulated.",
  },
  {
    q: "How is cleanup impact verified?",
    a: "The following Monday, the pipeline fetches a new Sentinel-2 image for the same quest zone coordinates and recomputes FDI and NDCI. The before/after difference gives a pollution reduction percentage, which is published in the Impact section.",
  },
  {
    q: "What if it's cloudy?",
    a: "Sentinel-2 data includes a cloud mask (SCL band). Zones with insufficient cloud-free water pixels are skipped. The pipeline automatically picks the least-cloudy image in a 7-day window.",
  },
  {
    q: "How are photos classified?",
    a: "Uploaded photos are sent to NVIDIA's DeepSeek-V4-Pro AI model which classifies litter type, severity, and whether items are on the water surface. Invalid photos (not near water, blurry, indoor) are automatically rejected.",
  },
  {
    q: "Is my GPS location stored?",
    a: "Your GPS coordinates are stored in our database only when you submit a pollution photo. They are used to build the pollution heatmap on the map page and are not shared externally.",
  },
];

export default function About() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-ocean" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">About & Science</h1>
      </div>

      {/* How it works */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Satellite className="w-5 h-5 text-ocean" /> How WaterQuest Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Satellite detects pollution", desc: "Every Monday, Sentinel-2 images 6 Netherlands waterway zones. AI computes NDCI (algae), FDI (floating plastic), and turbidity." },
            { step: "2", title: "AI selects quest zones",      desc: "DeepSeek-V4-Pro analyses satellite signals + citizen reports from Waarneming.nl to pick the 2 most impactful cleanup locations." },
            { step: "3", title: "Citizens take action",        desc: "Teams join Quest A or B, travel to the zone, photograph and remove garbage, and earn real-time points on the leaderboard." },
            { step: "4", title: "Impact verified by satellite",desc: "The following Monday, new satellite data confirms whether FDI and NDCI improved — closing the loop with before/after images." },
            { step: "5", title: "Teams compete and win",       desc: "The team with the higher score (points + satellite improvement) is declared the weekly winner." },
            { step: "6", title: "Zero cost infrastructure",    desc: "All satellite data is EU open data via Copernicus. AI via NVIDIA NIM free tier. Hosting via Vercel + Railway free tiers." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <span className="inline-block w-7 h-7 rounded-full bg-teal text-white text-xs font-bold
                flex items-center justify-center mb-3">
                {step}
              </span>
              <p className="font-semibold text-gray-900 mb-1 text-sm">{title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Spectral indices */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Satellite Indices Explained</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Index</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Formula</th>
                <th className="text-left px-4 py-3">Detects</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {INDICES.map(row => (
                <tr key={row.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-ocean font-mono text-xs">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 hidden sm:table-cell">{row.formula}</td>
                  <td className="px-4 py-3 text-gray-700">{row.detects}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{row.threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Data sources */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Data Sources</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Resolution</th>
                <th className="text-left px-4 py-3">Used For</th>
                <th className="text-right px-4 py-3">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {DATA_SOURCES.map(row => (
                <tr key={row.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{row.res}</td>
                  <td className="px-4 py-3 text-gray-600">{row.use}</td>
                  <td className="px-4 py-3 text-right text-teal font-semibold text-xs">{row.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber" /> FAQ
        </h2>
        <div className="space-y-3">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="bg-white rounded-2xl border border-gray-100 shadow-sm group">
              <summary className="flex items-center justify-between px-4 py-4 cursor-pointer
                font-medium text-gray-900 text-sm select-none min-h-[44px]">
                {q}
                <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                {a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal" /> Privacy
        </h2>
        <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 leading-relaxed">
          <p>WaterQuest stores GPS coordinates only when you voluntarily submit a pollution photo. No account or registration is required. Photos are stored in Supabase Storage. We do not share personal data with third parties. Satellite data is public EU open data from Copernicus.</p>
        </div>
      </section>
    </div>
  );
}
