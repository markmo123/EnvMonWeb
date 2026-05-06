import React from "react";

const styles = {
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    transition: "background 0.15s",
    minWidth: 0,
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    fontWeight: 500,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  icon: {
    fontSize: "20px",
    lineHeight: 1,
  },
  value: {
    fontSize: "36px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1,
  },
  unit: {
    fontSize: "16px",
    fontWeight: 400,
    color: "var(--text-secondary)",
    marginLeft: "4px",
  },
  subtext: {
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    display: "inline-block",
    marginRight: "5px",
    verticalAlign: "middle",
  },
};

export default function StatCard({ label, value, unit, icon, color, colorBg, subtext, trend }) {
  const cardStyle = {
    ...styles.card,
    borderTop: `2px solid ${color}`,
    background: colorBg || "var(--bg-card)",
  };

  return (
    <div style={cardStyle}>
      <div style={styles.topRow}>
        <span style={styles.label}>{label}</span>
        <span style={styles.icon}>{icon}</span>
      </div>
      <div>
        <span style={{ ...styles.value, color }}>
          {value !== null && value !== undefined ? value : "—"}
        </span>
        {unit && <span style={styles.unit}>{unit}</span>}
      </div>
      {subtext && (
        <div style={styles.subtext}>
          {trend !== undefined && (
            <span style={{ color: trend >= 0 ? "var(--green)" : "var(--red)" }}>
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}{unit}{" "}
            </span>
          )}
          {subtext}
        </div>
      )}
    </div>
  );
}
