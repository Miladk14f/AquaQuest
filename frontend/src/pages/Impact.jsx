import { useState, useEffect } from "react";
import { TrendingUp, Award, Satellite, Package } from "lucide-react";
import { SatelliteLink } from "../components/SatelliteLink";
import { api } from "../lib/api";

function ImprovementBadge({ pct }) {
  if (pct == null) return null;
  const positive = pct > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full
      ${positive ? "bg-teal-light text-teal-dark" : "bg-coral-light text-coral-dark"}`}>
      <TrendingUp className="w-3.5 h-3.5" />
      {positive ? "−" : "+"}{Math.abs(pct).toFixed(1)}% pollution
    </span>
  );
}

function QuestImpactCard({ quest, isLatest }) {
  const qa = quest.quest_a;
  const qb = quest.quest_b;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden
      ${isLatest ? "border-teal-dark ring-2 ring-teal" : "border-gray-100"}`}>
      {isLatest && (
        <div className="bg-teal px-4 py-2 text-white text-xs font-semibold flex items-center gap-2">
          <Award className="w-4 h-4" /> Most recent completed quest
        </div>
      )}
      <div className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 font-semibold">{quest.week_label}</p>
            <h3 className="font-bold text-gray-900">
              {qa?.zone} vs {qb?.zone}
            </h3>
          </div>
          <Satellite className="w-5 h-5 text-ocean" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {[{ q: qa, team: "A", color: "teal" }, { q: qb, team: "B", color: "coral" }].map(({ q, team, color }) => (
            q && (
              <div key={team} className={`rounded-xl p-3 bg-${color}-light border border-${color}`}>
                <p className={`text-xs font-semibold text-${color}-dark mb-1`}>
                  Quest {team} — {q.zone}
                </p>
                <p className="text-sm text-gray-700 capitalize">
                  {q.pollution_type?.replace(/_/g, " ")}
                </p>
                {q.urgency && (
                  <span className="text-xs text-gray-500">Urgency: {q.urgency}</span>
                )}
              </div>
            )
          ))}
        </div>

        {quest.ai_reasoning && (
          <p className="text-xs text-gray-500 line-clamp-3">{quest.ai_reasoning}</p>
        )}
      </div>
    </div>
  );
}

export default function Impact() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getQuestHistory(8).then(setHistory).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Placeholder totals — in production these come from the DB
  const totals = { kg: 0, quests: history.length, participants: 0 };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-teal" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Impact</h1>
      </div>

      {/* Season totals */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Package,    label: "kg Removed",      val: `${totals.kg} kg` },
          { icon: Satellite,  label: "Quests Run",       val: totals.quests },
          { icon: Award,      label: "Participants",     val: totals.participants },
        ].map(({ icon: Icon, label, val }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <Icon className="w-6 h-6 text-teal mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{val}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* How verification works */}
      <div className="bg-ocean-light border border-ocean rounded-2xl p-4 md:p-6 mb-8">
        <h2 className="font-bold text-ocean-dark mb-3 flex items-center gap-2">
          <Satellite className="w-5 h-5" />
          How Satellite Verification Works
        </h2>
        <ol className="space-y-2 text-sm text-ocean-dark">
          <li className="flex gap-2"><span className="font-bold">1.</span> Monday pipeline selects quest zones via Sentinel-2 FDI + NDCI readings</li>
          <li className="flex gap-2"><span className="font-bold">2.</span> Citizens clean the zone throughout the week</li>
          <li className="flex gap-2"><span className="font-bold">3.</span> Following Monday, a new Sentinel-2 pass is processed for the same zones</li>
          <li className="flex gap-2"><span className="font-bold">4.</span> FDI and NDCI before vs after are compared — improvement % is calculated</li>
          <li className="flex gap-2"><span className="font-bold">5.</span> Results posted here with actual satellite imagery links</li>
        </ol>
      </div>

      {/* Quest history */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Quest History</h2>
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-40 animate-pulse" />)}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Satellite className="w-10 h-10 mx-auto mb-3" />
          <p>No completed quests yet. Impact data appears the Monday after each quest.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((q, i) => (
            <QuestImpactCard key={q.id} quest={q} isLatest={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
