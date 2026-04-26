import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Satellite, AlertCircle, RefreshCw } from "lucide-react";
import { QuestCard } from "../components/QuestCard";
import { SatelliteLink } from "../components/SatelliteLink";
import { MapView } from "../components/MapView";
import { Countdown } from "../components/Countdown";
import { useQuests } from "../hooks/useQuests";

export default function Quest() {
  const { quest, loading, error } = useQuests();
  const [chosenTeam, setChosenTeam] = useState(
    () => localStorage.getItem("wq_team") || null
  );
  const navigate = useNavigate();

  function handleJoin(team) {
    localStorage.setItem("wq_team", team);
    setChosenTeam(team);
    navigate("/upload");
  }

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !quest) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">No active quest</h2>
        <p className="text-gray-500 text-sm mb-4">
          Quests are published every Monday at 07:00 UTC via the automated satellite pipeline.
        </p>
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <RefreshCw className="w-4 h-4" /> Check back Monday morning
        </div>
      </div>
    );
  }

  const satLinks = (() => {
    const data = quest.satellite_data;
    if (!Array.isArray(data)) return null;
    const match = data.find(z => z.zone === quest.quest_a?.zone);
    return match?.satellite_view_links || null;
  })();

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Satellite className="w-5 h-5 text-teal" />
            <span className="text-xs font-semibold text-teal uppercase tracking-wide">
              Week {quest.week_label}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">This Week's Quest</h1>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1">
          <p className="text-xs text-gray-500">Next reset in</p>
          <Countdown />
        </div>
      </div>

      {/* Team already chosen */}
      {chosenTeam && (
        <div className={`mb-6 rounded-2xl p-4 flex items-center gap-3
          ${chosenTeam === "A" ? "bg-teal-light border border-teal" : "bg-coral-light border border-coral"}`}>
          <span className="text-2xl">{chosenTeam === "A" ? "🌊" : "🔥"}</span>
          <div>
            <p className={`font-semibold ${chosenTeam === "A" ? "text-teal-dark" : "text-coral-dark"}`}>
              You're on Team {chosenTeam === "A" ? "Blue Wave" : "Red River"}!
            </p>
            <p className="text-xs text-gray-600">Head to the quest zone and report your cleanup.</p>
          </div>
        </div>
      )}

      {/* Quest cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <QuestCard quest={quest.quest_a} team="A" onJoin={handleJoin} />
        <QuestCard quest={quest.quest_b} team="B" onJoin={handleJoin} />
      </div>

      {/* AI reasoning */}
      {quest.ai_reasoning && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 md:p-5 mb-8">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            AI Selection Reasoning
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{quest.ai_reasoning}</p>
        </div>
      )}

      {/* Map */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Quest Zone Map</h2>
        <MapView quest={quest} height="h-[300px] md:h-[420px]" />
      </div>

      {/* Satellite links */}
      {satLinks && <SatelliteLink links={satLinks} />}
    </div>
  );
}
