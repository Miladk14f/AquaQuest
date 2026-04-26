import { useState, useEffect } from "react";
import { api } from "../lib/api";

export function useQuests() {
  const [quest,   setQuest]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.getCurrentQuest()
      .then(setQuest)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { quest, loading, error };
}
