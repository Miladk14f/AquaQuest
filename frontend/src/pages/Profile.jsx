import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, Camera, Droplets, LogOut, Medal, Star } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { signOut, getLeaderboard } from "../lib/auth.js";
import { supabase } from "../lib/supabase.js";

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
}

export default function Profile() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [events,      setEvents]      = useState([]);
  const [tab,         setTab]         = useState("stats"); // "stats" | "history" | "ranking"
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    getLeaderboard(50).then(setLeaderboard).catch(() => {});
    supabase
      .from("user_point_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setEvents(data || []));
  }, [user]);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <Droplets className="w-10 h-10 text-teal mx-auto mb-3" />
        <p className="font-semibold text-gray-800 mb-3">Sign in to track your impact</p>
        <Link to="/login" className="bg-teal text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-dark">
          Sign in
        </Link>
      </div>
    </div>;
  }

  const userRank = leaderboard.find(r => r.id === user.id);

  const EVENT_LABELS = {
    photo_upload: "📷 Photo submitted",
    checkin:      "📍 Zone check-in",
    combo:        "🔥 3-photo combo",
    discovery:    "🌟 New hotspot found",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-dark to-teal rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                : (profile?.username?.[0] || user.email[0]).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-lg">{profile?.username || user.email}</p>
              <p className="text-white/70 text-sm">{user.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="text-white/70 hover:text-white p-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{profile?.total_points || 0}</p>
            <p className="text-xs text-white/70 mt-0.5">Total Points</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{profile?.photos_submitted || 0}</p>
            <p className="text-xs text-white/70 mt-0.5">Photos</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{userRank?.rank ? `#${userRank.rank}` : "—"}</p>
            <p className="text-xs text-white/70 mt-0.5">Rank</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {[
          { key: "stats",   label: "Stats",     icon: Star },
          { key: "history", label: "History",   icon: Camera },
          { key: "ranking", label: "Leaderboard", icon: Trophy },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Stats tab */}
      {tab === "stats" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Medal className="w-4 h-4 text-amber" /> Your Impact
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total points",       val: profile?.total_points || 0 },
                { label: "Photos submitted",   val: profile?.photos_submitted || 0 },
                { label: "Cleanups attended",  val: profile?.cleanups_attended || 0 },
                { label: "Global rank",        val: userRank?.rank ? `#${userRank.rank}` : "Unranked" },
              ].map(({ label, val }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xl font-bold text-gray-900">{val}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/upload"
            className="block w-full bg-teal text-white text-center font-semibold
              py-3 rounded-xl hover:bg-teal-dark transition-colors"
          >
            📷 Submit a pollution photo → earn points
          </Link>
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {events.length === 0
            ? <div className="py-12 text-center text-gray-400 text-sm">
                No activity yet — start by submitting a photo!
              </div>
            : <ul className="divide-y divide-gray-50">
                {events.map(ev => (
                  <li key={ev.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {EVENT_LABELS[ev.event_type] || ev.event_type}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(ev.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className="font-bold text-teal text-sm">+{ev.points} pts</span>
                  </li>
                ))}
              </ul>
          }
        </div>
      )}

      {/* Ranking tab */}
      {tab === "ranking" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {leaderboard.length === 0
            ? <div className="py-12 text-center text-gray-400 text-sm">
                No rankings yet — be the first to earn points!
              </div>
            : <ul className="divide-y divide-gray-50">
                {leaderboard.map(r => (
                  <li key={r.id}
                    className={`flex items-center gap-3 px-4 py-3
                      ${r.id === user.id ? "bg-teal-light" : "hover:bg-gray-50"}`}>
                    <div className="w-8 text-center flex-shrink-0">
                      <RankBadge rank={r.rank} />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                      {r.avatar_url
                        ? <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        : r.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${r.id === user.id ? "text-teal-dark" : "text-gray-800"}`}>
                        {r.username} {r.id === user.id && "(you)"}
                      </p>
                      <p className="text-xs text-gray-400">{r.photos_submitted} photos</p>
                    </div>
                    <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
                      {r.total_points} pts
                    </span>
                  </li>
                ))}
              </ul>
          }
        </div>
      )}
    </div>
  );
}
