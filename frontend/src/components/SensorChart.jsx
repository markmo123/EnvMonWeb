import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TIMEFRAMES = [
  { value: "1d", label: "1 Day" },
  { value: "1w", label: "1 Week" },
  { value: "1m", label: "1 Month" },
  { value: "all", label: "All Time" },
];

const METRICS = [
  { key: "temperature", label: "Temp", color: "#f97316" },
  { key: "humidity", label: "Humidity", color: "#3b82f6" },
  { key: "light", label: "Light", color: "#eab308" },
];

const styles = {
  wrapper: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "20px 24px",
    gridColumn: "1 / -1",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "10px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  select: {
    fontSize: "12px",
    color: "var(--text-primary)",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    padding: "4px 10px",
    cursor: "pointer",
    outline: "none",
    appearance: "none",
    paddingRight: "24px",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238b8fa8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 8px center",
  },
  legend: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "var(--text-secondary)",
    cursor: "pointer",
    userSelect: "none",
  },
  legendDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
};

function formatTimestamp(ts, timeframe) {
  try {
    const d = new Date(ts);
    if (timeframe === "1d") {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (timeframe === "1w") {
      return d.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
    }
    // 1m or all
    return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return ts;
  }
}

export default function SensorChart({
  history,
  activeMetrics,
  onToggleMetric,
  timeframe,
  onTimeframeChange,
}) {
  // Compute axis bounds from the filtered history
  const tempValues = history.map((r) => r.temperature).filter((v) => v !== undefined);
  const lightValues = history.map((r) => r.light).filter((v) => v !== undefined);

  // Temperature: default 10–40, expand if data goes outside that range
  const tempMin = tempValues.length ? Math.min(10, Math.floor(Math.min(...tempValues)) - 1) : 10;
  const tempMax = tempValues.length ? Math.max(40, Math.ceil(Math.max(...tempValues)) + 1) : 40;

  // Light: always starts at 0, max based on data with a small buffer
  const lightMax = lightValues.length ? Math.ceil(Math.max(...lightValues) * 1.1) : 1000;

  const labels = useMemo(
    () => history.map((r) => formatTimestamp(r.timestamp, timeframe)),
    [history, timeframe]
  );

  const datasets = useMemo(() => {
    const all = [
      {
        key: "temperature",
        label: "Temperature (°C)",
        data: history.map((r) => r.temperature),
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.08)",
        pointBackgroundColor: "#f97316",
        yAxisID: "yTemp",
      },
      {
        key: "humidity",
        label: "Humidity (%)",
        data: history.map((r) => r.humidity),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        pointBackgroundColor: "#3b82f6",
        yAxisID: "yHumid",
      },
      {
        key: "light",
        label: "Light (lux)",
        data: history.map((r) => r.light),
        borderColor: "#eab308",
        backgroundColor: "rgba(234, 179, 8, 0.08)",
        pointBackgroundColor: "#eab308",
        yAxisID: "yLight",
      },
    ];

    return all
      .filter((d) => activeMetrics[d.key])
      .map((d) => ({
        ...d,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: history.length > 50 ? 0 : 3,
        pointHoverRadius: 5,
        fill: true,
      }));
  }, [history, activeMetrics]);

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(26, 29, 39, 0.98)",
        borderColor: "#2a2d3e",
        borderWidth: 1,
        titleColor: "#8b8fa8",
        bodyColor: "#e8eaf0",
        padding: 10,
        callbacks: {
          title: (items) => items[0]?.label || "",
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(42, 45, 62, 0.5)", drawTicks: false },
        ticks: {
          color: "#555870",
          maxTicksLimit: 8,
          maxRotation: 0,
          font: { size: 11 },
        },
      },
      yTemp: {
        display: activeMetrics.temperature,
        position: "left",
        min: tempMin,
        max: tempMax,
        grid: { color: "rgba(42, 45, 62, 0.5)" },
        ticks: {
          color: "#f97316",
          font: { size: 11 },
          callback: (v) => `${v}°`,
        },
      },
      yHumid: {
        display: activeMetrics.humidity,
        position: "left",
        min: 0,
        max: 100,
        grid: { display: false },
        ticks: {
          color: "#3b82f6",
          font: { size: 11 },
          callback: (v) => `${v}%`,
        },
      },
      yLight: {
        display: activeMetrics.light,
        position: "right",
        min: 0,
        max: lightMax,
        grid: { display: false },
        ticks: {
          color: "#eab308",
          font: { size: 11 },
          callback: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v),
        },
      },
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.title}>Sensor History</span>
          <select
            style={styles.select}
            value={timeframe}
            onChange={(e) => onTimeframeChange(e.target.value)}
          >
            {TIMEFRAMES.map((tf) => (
              <option key={tf.value} value={tf.value}>
                {tf.label}
              </option>
            ))}
          </select>
          {history.length > 0 && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {history.length} reading{history.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={styles.legend}>
          {METRICS.map((m) => (
            <div
              key={m.key}
              style={{
                ...styles.legendItem,
                opacity: activeMetrics[m.key] ? 1 : 0.35,
              }}
              onClick={() => onToggleMetric(m.key)}
            >
              <span style={{ ...styles.legendDot, background: m.color }} />
              {m.label}
            </div>
          ))}
        </div>
      </div>
      {history.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            padding: "40px 0",
            fontSize: "14px",
          }}
        >
          No data for this timeframe
        </div>
      ) : (
        <Line data={{ labels, datasets }} options={options} />
      )}
    </div>
  );
}
