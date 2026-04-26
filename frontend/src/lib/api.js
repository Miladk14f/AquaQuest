import { DEMO_QUEST, DEMO_SCORES, DEMO_HOTSPOTS, DEMO_HISTORY } from "./demo.js";

const BASE    = import.meta.env.VITE_API_URL || "http://localhost:8000";
const hasAPI  = BASE && !BASE.includes("localhost") ||
                (typeof window !== "undefined" && window.location.hostname !== "");

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// Wraps a real API call with a demo fallback if the backend is unreachable
async function withFallback(fn, fallback) {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export const api = {
  getCurrentQuest: () =>
    withFallback(() => request("/api/v1/quests/current"), DEMO_QUEST),

  getQuestHistory: (n = 10) =>
    withFallback(() => request(`/api/v1/quests/history?limit=${n}`), DEMO_HISTORY),

  getLiveScores: (id) =>
    withFallback(
      () => request(`/api/v1/scores/live${id ? `?quest_id=${id}` : ""}`),
      [DEMO_SCORES.A, DEMO_SCORES.B]
    ),

  getHotspots: (questId) =>
    withFallback(() => request(`/api/v1/photos/hotspots?quest_id=${questId}`), DEMO_HOTSPOTS),

  getSatReadings: (week) =>
    withFallback(
      () => request(`/api/v1/satellite-readings${week ? `?week_label=${week}` : ""}`),
      DEMO_QUEST.satellite_data.map((z, i) => ({ ...z, id: i + 1, zone_name: z.zone, week_label: DEMO_QUEST.week_label, reading_date: "2026-04-26" }))
    ),

  uploadPhoto: (formData) =>
    request("/api/v1/photos/upload", { method: "POST", body: formData }),
};
