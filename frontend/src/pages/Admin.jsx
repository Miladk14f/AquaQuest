import { useState, useEffect } from "react";
import { Shield, Play, RefreshCw, CheckCircle, AlertCircle, Database } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function useAdminAuth() {
  const [password, setPassword] = useState(() => sessionStorage.getItem("wq_admin") || "");
  const [authed,   setAuthed]   = useState(false);
  const [error,    setError]    = useState(null);

  async function login(pw) {
    try {
      const res = await fetch(`${API}/api/v1/admin/status`, {
        headers: { Authorization: "Basic " + btoa(`admin:${pw}`) },
      });
      if (res.ok) {
        setAuthed(true);
        setError(null);
        sessionStorage.setItem("wq_admin", pw);
        setPassword(pw);
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Cannot reach backend");
    }
  }

  return { password, setPassword, authed, login, error };
}

export default function Admin() {
  const { password, setPassword, authed, login, error } = useAdminAuth();
  const [status,    setStatus]    = useState(null);
  const [zones,     setZones]     = useState([]);
  const [running,   setRunning]   = useState(false);
  const [pipeResult, setPipeResult] = useState(null);
  const [pipeError,  setPipeError]  = useState(null);

  useEffect(() => {
    if (!authed) return;
    fetchStatus();
    fetchZones();
  }, [authed]);

  async function authFetch(path, opts = {}) {
    const pw = sessionStorage.getItem("wq_admin") || "";
    return fetch(`${API}${path}`, {
      ...opts,
      headers: {
        Authorization: "Basic " + btoa(`admin:${pw}`),
        ...opts.headers,
      },
    });
  }

  async function fetchStatus() {
    const res = await authFetch("/api/v1/admin/status");
    if (res.ok) setStatus(await res.json());
  }

  async function fetchZones() {
    const res = await authFetch("/api/v1/admin/zones-preview");
    if (res.ok) setZones(await res.json());
  }

  async function runPipeline() {
    setRunning(true);
    setPipeResult(null);
    setPipeError(null);
    try {
      const res = await authFetch("/api/v1/admin/run-pipeline", { method: "POST" });
      const data = await res.json();
      if (res.ok) setPipeResult(data);
      else        setPipeError(data.detail || "Pipeline failed");
    } catch (err) {
      setPipeError(err.message);
    } finally {
      setRunning(false);
      fetchStatus();
    }
  }

  // Login gate
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-6 h-6 text-teal" />
            <h1 className="text-xl font-bold text-gray-900">Admin Access</h1>
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login(password)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-4
              focus:outline-none focus:ring-2 focus:ring-teal"
            placeholder="Admin password"
          />
          {error && (
            <p className="text-red-500 text-xs mb-3 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
          <button
            onClick={() => login(password)}
            className="w-full bg-teal text-white font-semibold py-2.5 rounded-xl
              min-h-[44px] hover:bg-teal-dark transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-teal" />
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      {/* Status cards */}
      {status && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Latest Quest</p>
            <p className="font-bold text-gray-900">{status.latest_quest?.week_label || "—"}</p>
            <p className="text-xs text-gray-400">{status.latest_quest?.created_at?.slice(0,10) || ""}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Last Photo</p>
            <p className="font-bold text-gray-900">{status.last_photo?.created_at?.slice(0,10) || "None"}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Satellite Readings</p>
            <p className="font-bold text-gray-900">{status.total_sat_readings ?? "—"}</p>
          </div>
        </div>
      )}

      {/* Pipeline trigger */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
        <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Play className="w-5 h-5 text-teal" /> Run Weekly Pipeline
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Fetches Sentinel-2 data, enriches with Waarneming.nl, selects quests via DeepSeek AI, and saves to Supabase.
          This runs automatically every Monday at 07:00 UTC.
        </p>
        <button
          onClick={runPipeline}
          disabled={running}
          className="flex items-center gap-2 bg-teal text-white font-semibold px-5 py-2.5
            rounded-xl min-h-[44px] hover:bg-teal-dark transition-colors disabled:opacity-50"
        >
          {running
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Running pipeline...</>
            : <><Play className="w-4 h-4" /> Run Now</>}
        </button>

        {pipeResult && (
          <div className="mt-4 bg-teal-light border border-teal rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-teal" />
              <span className="font-semibold text-teal-dark text-sm">Pipeline succeeded</span>
            </div>
            <p className="text-sm text-teal-dark">Quest A: <strong>{pipeResult.quest_a}</strong></p>
            <p className="text-sm text-teal-dark">Quest B: <strong>{pipeResult.quest_b}</strong></p>
            <p className="text-xs text-teal mt-2">{pipeResult.summary}</p>
          </div>
        )}
        {pipeError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700 text-sm">Pipeline failed</p>
                <p className="text-xs text-red-600 mt-1">{pipeError}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zone readings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-ocean" />
            <h2 className="font-bold text-gray-900">Recent Zone Readings</h2>
          </div>
          <button
            onClick={fetchZones}
            className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-800
              px-2 py-1 rounded-lg hover:bg-gray-50 min-h-[36px]"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Zone</th>
                <th className="text-right px-4 py-3">NDCI</th>
                <th className="text-right px-4 py-3">FDI</th>
                <th className="text-right px-4 py-3">Turbidity</th>
                <th className="text-right px-4 py-3">Px</th>
                <th className="text-right px-4 py-3">Reports</th>
                <th className="text-right px-4 py-3">Week</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {zones.map(z => (
                <tr key={z.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{z.zone_name}</td>
                  <td className={`px-4 py-3 text-right font-mono text-xs
                    ${z.ndci_mean > 0.15 ? "text-coral font-bold" : z.ndci_mean > 0.05 ? "text-amber" : "text-gray-400"}`}>
                    {z.ndci_mean?.toFixed(3) ?? "—"}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-xs
                    ${z.fdi_max > 0.02 ? "text-coral font-bold" : "text-gray-400"}`}>
                    {z.fdi_max?.toFixed(3) ?? "—"}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-xs
                    ${z.turbidity_mean > 1.5 ? "text-coral font-bold" : "text-gray-400"}`}>
                    {z.turbidity_mean?.toFixed(3) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">{z.water_pixels ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">{z.citizen_reports}</td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs whitespace-nowrap">{z.week_label}</td>
                </tr>
              ))}
              {zones.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No readings yet — run the pipeline to populate
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
