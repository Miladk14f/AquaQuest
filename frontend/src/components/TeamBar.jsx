function Bar({ team, data }) {
  const pct  = Math.min(100, data.goal_pct || 0);
  const isA  = team === "A";

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{isA ? "🌊" : "🔥"}</span>
          <div>
            <p className="font-semibold text-gray-900 text-sm md:text-base">
              {isA ? "Team Blue Wave" : "Team Red River"}
            </p>
            <p className="text-xs text-gray-500">Quest {team}</p>
          </div>
        </div>
        <span className={`text-xl font-bold ${isA ? "text-teal-dark" : "text-coral-dark"}`}>
          {pct}%
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${isA ? "bg-teal" : "bg-coral"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-sm font-bold text-gray-800">{data.participant_count || 0}</p>
          <p className="text-xs text-gray-500">cleaners</p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{data.total_points || 0}</p>
          <p className="text-xs text-gray-500">points</p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{data.kg_removed || 0} kg</p>
          <p className="text-xs text-gray-500">removed</p>
        </div>
      </div>
    </div>
  );
}

export function TeamBar({ scores, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {["A", "B"].map(t => (
          <div key={t} className="bg-gray-100 rounded-2xl h-36 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Bar team="A" data={scores.A || {}} />
      <Bar team="B" data={scores.B || {}} />
    </div>
  );
}
