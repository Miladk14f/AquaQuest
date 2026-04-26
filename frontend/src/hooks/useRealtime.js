import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";

export function useRealtime(questId) {
  const [scores,  setScores]  = useState({ A: {}, B: {} });
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    try {
      const data = await api.getLiveScores(questId);
      setScores({
        A: data.find(s => s.team === "A") || {},
        B: data.find(s => s.team === "B") || {},
      });
    } catch {
      // ignore — demo fallback already handled inside api.getLiveScores
    } finally {
      setLoading(false);
    }
  }, [questId]);

  useEffect(() => {
    fetchScores();

    // Only subscribe to real-time if Supabase is configured
    if (!supabase || !questId) return;

    const channel = supabase
      .channel(`team_scores_${questId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_scores" },
        () => fetchScores()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [questId, fetchScores]);

  return { scores, loading, refetch: fetchScores };
}
