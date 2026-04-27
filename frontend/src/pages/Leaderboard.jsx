import { Trophy, Users, Package, Zap } from "lucide-react";
import { TeamBar } from "../components/TeamBar";
import { Countdown } from "../components/Countdown";
import { useQuests } from "../hooks/useQuests";
import { useRealtime } from "../hooks/useRealtime";

const POINTS_TABLE = [
  { action: "Check in at quest zone (GPS)",      pts: 50,       note: "Once per day" },
  { action: "Submit valid pollution photo",       pts: "15–30",  note: "low/medium/high" },
  { action: "AI confidence bonus (>0.8)",        pts: "+5",     note: "Per photo" },
  { action: "First photo at new GPS cluster",    pts: 50,       note: "Discovery bonus" },
  { action: "3 submissions in one visit",        pts: 75,       note: "Combo!" },
  { action: "Satellite improvement confirmed",   pts: 200,      note: "Whole team, next Mon" },
  { action: "Recruit a new user",                pts: 100,      note: "Via referral" },
];

function LeaderboardInner() {
  const { quest, loading } = useQuests();
  const { scores, loading: scoresLoading } = useRealtime(quest?.id);

  const aTotal  = scores?.A?.total_points || 0;
  const bTotal  = scores?.B?.total_points || 0;
  const winning = aTotal === bTotal ? null : aTotal > bTotal ? "A" : "B";

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Live Scoreboard</h1>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Quest resets in</p>
          <Countdown />
        </div>
      </div>

      {/* Winning banner */}
      {winning && !loading && (
        <div className={`rounded-2xl p-4 mb-6 flex items-center gap-3
          ${winning === "A" ? "bg-teal-light border border-teal" : "bg-coral-light border border-coral"}`}>
          <Trophy className={`w-6 h-6 ${winning === "A" ? "text-teal" : "text-coral"}`} />
          <p className={`font-bold ${winning === "A" ? "text-teal-dark" : "text-coral-dark"}`}>
            Team {winning === "A" ? "🌊 Blue Wave" : "🔥 Red River"} is winning!
          </p>
        </div>
      )}

      {/* Team bars — single source of truth for scores */}
      <div className="mb-8">
        <TeamBar scores={scores} loading={scoresLoading} />
      </div>

      {/* Weekly stats */}
      {!scoresLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users,   label: "Team A Cleaners", val: scores?.A?.participant_count || 0 },
            { icon: Users,   label: "Team B Cleaners", val: scores?.B?.participant_count || 0 },
            { icon: Package, label: "kg Removed (A)",  val: `${scores?.A?.kg_removed || 0} kg` },
            { icon: Package, label: "kg Removed (B)",  val: `${scores?.B?.kg_removed || 0} kg` },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center shadow-sm">
              <Icon className="w-5 h-5 text-gray-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-900">{val}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Points table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber" />
          <h2 className="font-bold text-gray-900">How Points Work</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-right px-4 py-3 whitespace-nowrap">Points</th>
                <th className="text-right px-4 py-3 hidden sm:table-cell">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {POINTS_TABLE.map(row => (
                <tr key={row.action} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{row.action}</td>
                  <td className="px-4 py-3 text-right font-bold text-teal whitespace-nowrap">{row.pts}</td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs hidden sm:table-cell">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  return <LeaderboardInner />;
}
