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
  },
  title: {
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--text-primary)",
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
  },
  legendDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
};

function formatTimestamp(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return ts;
  }
}

export default function SensorChart({ history, activeMetrics, onToggleMetric }) {
  const labels = useMemo(
    () => history.map((r) => formatTimestamp(r.timestamp)),
    [history]
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
        pointRadius: history.length > 30 ? 0 : 3,
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
        grid: { display: false },
        ticks: {
          color: "#3b82f6",
          font: { size: 11 },
          callback: (v) => `${v}%`,
        },
        min: 0,
        max: 100,
      },
      yLight: {
        display: activeMetrics.light,
        position: "right",
        grid: { display: false },
        ticks: {
          color: "#eab308",
          font: { size: 11 },
          callback: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v),
        },
      },
    },
  };

  const METRICS = [
    { key: "temperature", label: "Temp", color: "#f97316" },
    { key: "humidity", label: "Humidity", color: "#3b82f6" },
    { key: "light", label: "Light", color: "#eab308" },
  ];

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.title}>Sensor History</span>
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
              <span
                style={{
                  ...styles.legendDot,
                  background: m.color,
                }}
              />
              {m.label}
            </div>
          ))}
        </div>
      </div>
      {history.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0", fontSize: "14px" }}>
          No data yet — submit your first reading to see the chart
        </div>
      ) : (
        <Line data={{ labels, datasets }} options={options} />
      )}
    </div>
  );
}
