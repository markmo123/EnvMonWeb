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
        fetch(`${API_BASE}/api/readings/history?limit=60`),
      ]);

      if (latestRes.status === 404) {
        // No data yet — not an error
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
