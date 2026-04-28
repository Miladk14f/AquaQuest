import { useState } from "react";
import { Camera, Info } from "lucide-react";
import { PhotoUpload } from "../components/PhotoUpload";
import { useQuests } from "../hooks/useQuests";

export default function Upload() {
  const { quest, loading } = useQuests();
  const [team, setTeam]   = useState(
    () => localStorage.getItem("wq_team") || "A"
  );

  function chooseTeam(t) {
    setTeam(t);
    localStorage.setItem("wq_team", t);
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Camera className="w-6 h-6 text-teal" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Report Pollution</h1>
      </div>

      {/* Team selector */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Which team are you on?</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "A", label: "🌊 Blue Wave", color: "teal" },
            { id: "B", label: "🔥 Red River", color: "coral" },
          ].map(({ id, label, color }) => (
            <button
              key={id}
              onClick={() => chooseTeam(id)}
              className={`min-h-[44px] rounded-xl font-semibold text-sm border-2 transition-colors
                ${team === id
                  ? `bg-${color} text-white border-${color}`
                  : `bg-white text-gray-700 border-gray-200 hover:border-${color}`}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-ocean-light border border-ocean rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-ocean flex-shrink-0 mt-0.5" />
          <div className="text-sm text-ocean-dark">
            <p className="font-semibold mb-1">Tips for valid photos</p>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>Show visible litter or algae near or on water</li>
              <li>Take photo outdoors in natural light</li>
              <li>Include water or riverbank in the frame</li>
              <li>Enable GPS before submitting</li>
            </ul>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
      ) : (
        <PhotoUpload questId={quest?.id || 1} team={team} />
      )}
    </div>
  );
}
