import { supabase, supabaseConfigured } from "./supabase.js";
import { DEMO_QUEST, DEMO_SCORES, DEMO_HOTSPOTS, DEMO_HISTORY } from "./demo.js";

const BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Supabase-direct helpers (used when backend not deployed) ──────────────────

async function supabaseCurrentQuest() {
  const { data, error } = await supabase
    .from("weekly_quests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error || !data?.length) throw new Error("no quest");
  return data[0];
}

async function supabaseLiveScores(questId) {
  let query = supabase.from("team_scores").select("*");
  if (questId) {
    query = query.eq("quest_id", questId);
  } else {
    const { data: latest } = await supabase
      .from("weekly_quests")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1);
    if (latest?.length) query = query.eq("quest_id", latest[0].id);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

async function supabaseHistory(n) {
  const { data, error } = await supabase
    .from("weekly_quests")
    .select("id, week_label, quest_a, quest_b, created_at")
    .order("created_at", { ascending: false })
    .limit(n);
  if (error) throw new Error(error.message);
  return data || [];
}

async function supabaseSatReadings(week) {
  let query = supabase
    .from("satellite_readings")
    .select("*")
    .order("created_at", { ascending: false });
  if (week) query = query.eq("week_label", week);
  const { data, error } = await query.limit(20);
  if (error) throw new Error(error.message);
  return data || [];
}

// ── Public API ────────────────────────────────────────────────────────────────

async function withFallback(supabaseFn, backendPath, fallback) {
  // 1. Try Supabase directly (no backend needed)
  if (supabaseConfigured) {
    try { return await supabaseFn(); } catch { /* fall through */ }
  }
  // 2. Try backend API
  if (BASE) {
    try { return await request(backendPath); } catch { /* fall through */ }
  }
  // 3. Demo data
  return fallback;
}

export const api = {
  getCurrentQuest: () =>
    withFallback(
      () => supabaseCurrentQuest(),
      "/api/v1/quests/current",
      DEMO_QUEST,
    ),

  getQuestHistory: (n = 10) =>
    withFallback(
      () => supabaseHistory(n),
      `/api/v1/quests/history?limit=${n}`,
      DEMO_HISTORY,
    ),

  getLiveScores: (id) =>
    withFallback(
      () => supabaseLiveScores(id),
      `/api/v1/scores/live${id ? `?quest_id=${id}` : ""}`,
      [DEMO_SCORES.A, DEMO_SCORES.B],
    ),

  getHotspots: (questId) =>
    withFallback(
      async () => {
        // Query validated photos from Supabase and cluster them client-side
        const { data, error } = await supabase
          .from("pollution_photos")
          .select("gps_lat,gps_lng,litter_type,severity")
          .eq("quest_id", questId)
          .eq("is_valid", true);
        if (error) throw new Error(error.message);
        if (!data?.length) return [];
        // Group nearby photos (simple 50m grid bucketing)
        const buckets = {};
        for (const p of data) {
          const key = `${Math.round(p.gps_lat * 200)}_${Math.round(p.gps_lng * 200)}`;
          if (!buckets[key]) buckets[key] = { lat: p.gps_lat, lng: p.gps_lng, photos: [] };
          buckets[key].photos.push(p);
        }
        const severityScore = { low: 1, medium: 2, high: 3 };
        return Object.values(buckets)
          .filter(b => b.photos.length >= 1)
          .map(b => {
            const types = b.photos.map(p => p.litter_type || "mixed");
            return {
              lat: b.lat, lng: b.lng,
              photo_count: b.photos.length,
              intensity: Math.min(100, b.photos.reduce((s, p) => s + (severityScore[p.severity] || 1), 0) * 10),
              dominant_litter: types.sort((a, z) =>
                types.filter(t => t === z).length - types.filter(t => t === a).length
              )[0],
            };
          })
          .sort((a, b) => b.intensity - a.intensity);
      },
      `/api/v1/photos/hotspots?quest_id=${questId}`,
      [],  // no fake demo hotspots
    ),

  getSatReadings: (week) =>
    withFallback(
      () => supabaseSatReadings(week),
      `/api/v1/satellite-readings${week ? `?week_label=${week}` : ""}`,
      DEMO_QUEST.satellite_data.map((z, i) => ({
        ...z, id: i + 1, zone_name: z.zone,
        week_label: DEMO_QUEST.week_label, reading_date: "2026-04-26",
      })),
    ),

  uploadPhoto: (formData) =>
    request("/api/v1/photos/upload", { method: "POST", body: formData }),
};
