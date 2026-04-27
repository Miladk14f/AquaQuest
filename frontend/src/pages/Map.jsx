import { useState, useEffect } from "react";
import { Layers, RefreshCw } from "lucide-react";
import { MapView } from "../components/MapView";
import { useQuests } from "../hooks/useQuests";
import { api } from "../lib/api";

export default function MapPage() {
  const { quest, loading }        = useQuests();
  const [hotspots, setHotspots]   = useState([]);
  const [satData,  setSatData]    = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!quest?.id) return;
    api.getHotspots(quest.id).then(setHotspots).catch(() => {});
    api.getSatReadings(quest.week_label).then(setSatData).catch(() => {});
  }, [quest]);

  async function refresh() {
    if (!quest?.id) return;
    setRefreshing(true);
    await Promise.all([
      api.getHotspots(quest.id).then(setHotspots).catch(() => {}),
      api.getSatReadings(quest.week_label).then(setSatData).catch(() => {}),
    ]);
    setRefreshing(false);
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-ocean" />
          <h1 className="text-2xl font-bold text-gray-900">Pollution Map</h1>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900
            px-3 py-2 rounded-lg hover:bg-gray-50 min-h-[44px] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-teal inline-block" />
          Quest A Zone
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-coral inline-block" />
          Quest B Zone
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber inline-block" />
          Photo Hotspot {hotspots.length === 0 && <span className="text-gray-400">(none yet this week)</span>}
        </div>
      </div>

      {loading ? (
        <div className="bg-gray-100 rounded-2xl animate-pulse h-[60vh]" />
      ) : (
        <MapView
          quest={quest}
          hotspots={hotspots}
          height="h-[60vh] md:h-[70vh]"
        />
      )}

      {/* Satellite readings table */}
      {satData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Satellite Readings This Week</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Zone</th>
                  <th className="text-right px-4 py-3">NDCI</th>
                  <th className="text-right px-4 py-3">FDI</th>
                  <th className="text-right px-4 py-3">Turbidity</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">Water px</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">Reports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {satData.map(z => (
                  <tr key={z.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{z.zone_name}</td>
                    <td className={`px-4 py-3 text-right font-mono text-xs
                      ${z.ndci_mean > 0.15 ? "text-coral font-bold" : z.ndci_mean > 0.05 ? "text-amber" : "text-gray-500"}`}>
                      {z.ndci_mean?.toFixed(3)}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono text-xs
                      ${z.fdi_max > 0.02 ? "text-coral font-bold" : "text-gray-500"}`}>
                      {z.fdi_max?.toFixed(3)}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono text-xs
                      ${z.turbidity_mean > 1.5 ? "text-coral font-bold" : "text-gray-500"}`}>
                      {z.turbidity_mean?.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs hidden md:table-cell">
                      {z.water_pixels}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs hidden md:table-cell">
                      {z.citizen_reports}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Red = above threshold · NDCI &gt;0.15 = confirmed bloom · FDI &gt;0.02 = plastic confirmed
          </p>
        </div>
      )}
    </div>
  );
}
