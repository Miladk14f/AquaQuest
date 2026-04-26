import { MapPin, Satellite, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";

const POLLUTION_LABELS = {
  floating_plastic: "Floating Plastic",
  algae_bloom:      "Algae Bloom",
  mixed:            "Mixed Pollution",
  turbidity:        "High Turbidity",
};

const URGENCY_STYLES = {
  high:   "bg-coral-light text-coral-dark border-coral",
  medium: "bg-amber-light text-amber-dark border-amber",
};

export function QuestCard({ quest, team, onJoin }) {
  if (!quest) return null;

  const isA        = team === "A";
  const accent     = isA ? "teal" : "coral";
  const teamLabel  = isA ? "🌊 Blue Wave" : "🔥 Red River";

  return (
    <div className={`bg-white rounded-2xl border-2 ${isA ? "border-teal" : "border-coral"} shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className={`${isA ? "bg-teal" : "bg-coral"} px-4 py-3 flex items-center justify-between`}>
        <div>
          <p className="text-white text-xs font-medium opacity-80">Quest {team}</p>
          <p className="text-white font-bold text-base">{teamLabel}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full border
          ${URGENCY_STYLES[quest.urgency] || URGENCY_STYLES.medium}`}>
          {quest.urgency === "high" ? "🚨 Urgent" : "⚠️ Medium"}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 md:p-5">
        {/* Location */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 text-${accent}`} />
          <div>
            <p className="font-semibold text-gray-900">{quest.zone}</p>
            <p className="text-sm text-gray-500">{quest.city}</p>
          </div>
        </div>

        {/* Pollution type */}
        <div className="mb-3">
          <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full
            ${isA ? "bg-teal-light text-teal-dark" : "bg-coral-light text-coral-dark"}`}>
            {POLLUTION_LABELS[quest.pollution_type] || quest.pollution_type}
          </span>
        </div>

        {/* What to clean */}
        <p className="text-sm text-gray-700 mb-4 leading-relaxed">{quest.what_to_clean}</p>

        {/* Satellite evidence */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-1 mb-1">
            <Satellite className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Satellite Evidence
            </span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{quest.satellite_evidence}</p>
        </div>

        {/* Citizen confirmed */}
        {quest.citizen_confirmed && (
          <div className="flex items-center gap-2 text-teal text-xs font-medium mb-4">
            <CheckCircle className="w-4 h-4" />
            Citizen confirmed — ground-truth verified
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 flex-wrap">
          {onJoin && (
            <button
              onClick={() => onJoin(team)}
              className={`flex-1 min-h-[44px] font-semibold rounded-xl text-sm
                transition-opacity hover:opacity-90
                ${isA ? "bg-teal text-white" : "bg-coral text-white"}`}
            >
              Join {teamLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
