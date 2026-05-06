import React, { useState } from "react";
import { useSensorData } from "./hooks/useSensorData";
import StatCard from "./components/StatCard";
import SensorChart from "./components/SensorChart";

const styles = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "24px 20px",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "28px",
    flexWrap: "wrap",
    gap: "12px",
  },
  titleGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  title: {
    fontSize: "22px",
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "13px",
    color: "var(--text-secondary)",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },
  refreshBtn: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    padding: "4px 12px",
    borderRadius: "6px",
    border: "1px solid var(--border)",
    background: "var(--bg-card)",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "16px",
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "10px",
    padding: "14px 18px",
    marginBottom: "16px",
    color: "#fca5a5",
    fontSize: "14px",
  },
  emptyBox: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "48px 24px",
    textAlign: "center",
    gridColumn: "1 / -1",
  },
  emptyTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "8px",
  },
  emptyText: {
    fontSize: "13px",
    color: "var(--text-muted)",
    fontFamily: "monospace",
    background: "rgba(255,255,255,0.04)",
    padding: "12px 16px",
    borderRadius: "8px",
    marginTop: "12px",
    textAlign: "left",
    lineHeight: 1.8,
  },
  footer: {
    marginTop: "24px",
    paddingTop: "16px",
    borderTop: "1px solid var(--border)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    color: "var(--text-muted)",
    flexWrap: "wrap",
    gap: "8px",
  },
};

function calcTrend(history, key) {
  if (history.length < 2) return undefined;
  const prev = history[history.length - 2]?.[key];
  const curr = history[history.length - 1]?.[key];
  if (prev === undefined || curr === undefined) return undefined;
  return curr - prev;
}

function formatTime(date) {
  if (!date) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function App() {
  const { latest, history, loading, error, lastUpdated, refresh } = useSensorData(30000);
  const [activeMetrics, setActiveMetrics] = useState({
    temperature: true,
    humidity: true,
    light: true,
  });

  const toggleMetric = (key) =>
    setActiveMetrics((prev) => ({ ...prev, [key]: !prev[key] }));

  const isOnline = latest && lastUpdated && (Date.now() - lastUpdated) < 90000;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <div style={styles.title}>📡 IoT Sensor Dashboard</div>
          <div style={styles.subtitle}>
            Real-time temperature, humidity &amp; light monitoring
          </div>
        </div>
        <div style={styles.statusRow}>
          <div style={styles.statusBadge}>
            <span
              style={{
                ...styles.dot,
                background: error ? "var(--red)" : isOnline ? "var(--green)" : "var(--text-muted)",
              }}
            />
            {error ? "Error" : isOnline ? "Live" : loading ? "Loading…" : "No data"}
          </div>
          {lastUpdated && (
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Updated {formatTime(lastUpdated)}
            </span>
          )}
          <button style={styles.refreshBtn} onClick={refresh}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={styles.errorBox}>
          ⚠️ Could not reach API: {error}. Check that your Azure Functions are deployed and VITE_API_BASE_URL is set.
        </div>
      )}

      {/* Stat cards */}
      {!loading && !latest ? (
        <div style={styles.grid}>
          <div style={styles.emptyBox}>
            <div style={styles.emptyTitle}>No sensor data yet</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
              Submit your first reading to get started:
            </div>
            <pre style={styles.emptyText}>{`curl -X POST https://YOUR_FUNC_URL/api/readings \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"temperature": 22.5, "humidity": 60.0, "light": 380}'`}</pre>
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          <StatCard
            label="Temperature"
            value={latest?.temperature ?? (loading ? null : "—")}
            unit="°C"
            icon="🌡️"
            color="var(--accent-temp)"
            colorBg="var(--accent-temp-bg)"
            subtext={latest ? `Feels like ${(latest.temperature * 1.05).toFixed(1)}°C with humidity` : "Waiting for data"}
            trend={calcTrend(history, "temperature")}
          />
          <StatCard
            label="Humidity"
            value={latest?.humidity ?? (loading ? null : "—")}
            unit="%"
            icon="💧"
            color="var(--accent-humid)"
            colorBg="var(--accent-humid-bg)"
            subtext={
              latest
                ? latest.humidity < 30
                  ? "Low — consider a humidifier"
                  : latest.humidity > 70
                  ? "High — good ventilation advised"
                  : "Comfortable range"
                : "Waiting for data"
            }
            trend={calcTrend(history, "humidity")}
          />
          <StatCard
            label="Light"
            value={latest?.light ?? (loading ? null : "—")}
            unit=" lux"
            icon="☀️"
            color="var(--accent-light)"
            colorBg="var(--accent-light-bg)"
            subtext={
              latest
                ? latest.light < 50
                  ? "Dark / nighttime"
                  : latest.light < 500
                  ? "Indoor / overcast"
                  : latest.light < 10000
                  ? "Bright indoor / cloudy"
                  : "Full sunlight"
                : "Waiting for data"
            }
            trend={calcTrend(history, "light")}
          />
        </div>
      )}

      {/* Chart */}
      <div style={styles.grid}>
        <SensorChart
          history={history}
          activeMetrics={activeMetrics}
          onToggleMetric={toggleMetric}
        />
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span>
          Showing {history.length} reading{history.length !== 1 ? "s" : ""}
          {latest ? ` · Device: ${latest.deviceId}` : ""}
        </span>
        <span>Auto-refreshes every 30 seconds</span>
      </div>
    </div>
  );
}
