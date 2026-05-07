import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export function useSensorData(refreshInterval = 30000) {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [latestRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/api/readings/latest`),
        // Fetch max 500 readings — client filters by timeframe
        fetch(`${API_BASE}/api/readings/history?limit=500`),
      ]);

      if (latestRes.status === 404) {
        setLatest(null);
        setHistory([]);
        setError(null);
        setLoading(false);
        setLastUpdated(new Date());
        return;
      }

      if (!latestRes.ok || !historyRes.ok) {
        throw new Error(`API error: ${latestRes.status}`);
      }

      const [latestData, historyData] = await Promise.all([
        latestRes.json(),
        historyRes.json(),
      ]);

      setLatest(latestData);
      setHistory(historyData.readings || []);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { latest, history, loading, error, lastUpdated, refresh: fetchData };
}

/**
 * Filter a history array to only include readings within the given timeframe.
 * timeframe: "1d" | "1w" | "1m" | "all"
 */
export function filterByTimeframe(history, timeframe) {
  if (timeframe === "all" || !history.length) return history;

  const now = Date.now();
  const ms = {
    "1d": 24 * 60 * 60 * 1000,
    "1w": 7 * 24 * 60 * 60 * 1000,
    "1m": 30 * 24 * 60 * 60 * 1000,
  }[timeframe];

  if (!ms) return history;
  const cutoff = now - ms;
  return history.filter((r) => new Date(r.timestamp).getTime() >= cutoff);
}
