"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [status, setStatus] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const load = async () => {
    try {
      const [s, h] = await Promise.all([
        fetch("/api/status").then((r) => r.json()),
        fetch("/api/history?limit=30").then((r) => r.json()),
      ]);
      setStatus(s);
      setHistory(h.trades || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, []);

  const kill = async () => {
    if (!confirm("CLOSE ALL & DISABLE BOT?")) return;
    await fetch("/api/kill", { method: "POST" });
    load();
  };

  const toggle = async () => {
    await fetch("/api/toggle", { method: "POST" });
    load();
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>🤖 Broker Bot</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        <Card label="Status" value={status?.enabled ? "🟢 ON" : "🔴 OFF"} />
        <Card label="Equity" value={`$${status?.equity?.toFixed(2) || "—"}`} />
        <Card label="Daily PnL" value={`$${status?.dailyPnl?.toFixed(2) || "—"}`} color={status?.dailyPnl >= 0 ? "#4ade80" : "#f87171"} />
        <Card label="Positions" value={String(status?.openPositions || 0)} />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button onClick={toggle} style={{ padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
          {status?.enabled ? "⏸ Stop" : "▶ Start"}
        </button>
        <button onClick={kill} style={{ padding: "8px 16px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
          ☠️ KILL
        </button>
      </div>

      {status?.positions && Object.keys(status.positions).length > 0 && (
        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse", marginBottom: 24 }}>
          <thead><tr style={{ borderBottom: "1px solid #374151" }}>
            <th style={{ textAlign: "left", padding: 8 }}>Asset</th><th style={{ padding: 8 }}>Side</th><th style={{ padding: 8 }}>Entry</th><th style={{ padding: 8 }}>SL</th><th style={{ padding: 8 }}>TP</th><th style={{ padding: 8 }}>Regime</th>
          </tr></thead>
          <tbody>{Object.values(status.positions).map((p: any) => (
            <tr key={p.asset} style={{ borderBottom: "1px solid #1f2937" }}>
              <td style={{ padding: 8, fontWeight: "bold" }}>{p.asset}</td>
              <td style={{ padding: 8, color: p.side === "B" ? "#4ade80" : "#f87171" }}>{p.side}</td>
              <td style={{ padding: 8 }}>{p.entry?.toFixed(2)}</td>
              <td style={{ padding: 8, color: "#f87171" }}>{p.sl?.toFixed(2)}</td>
              <td style={{ padding: 8, color: "#4ade80" }}>{p.tp?.toFixed(2)}</td>
              <td style={{ padding: 8 }}>{p.regime}</td>
            </tr>
          ))}</tbody>
        </table>
      )}

      <h2 style={{ fontSize: 18, marginBottom: 8 }}>Trades</h2>
      <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
        <thead><tr style={{ borderBottom: "1px solid #374151" }}>
          <th style={{ textAlign: "left", padding: 8 }}>Time</th><th style={{ padding: 8 }}>Asset</th><th style={{ padding: 8 }}>PnL</th><th style={{ padding: 8 }}>Regime</th><th style={{ padding: 8 }}>Exit</th>
        </tr></thead>
        <tbody>
          {history.map((t: any, i: number) => (
            <tr key={i} style={{ borderBottom: "1px solid #1f2937" }}>
              <td style={{ padding: 8, color: "#9ca3af" }}>{t.timestamp?.slice(0, 16)}</td>
              <td style={{ padding: 8, fontWeight: "bold" }}>{t.asset}</td>
              <td style={{ padding: 8, color: t.pnl >= 0 ? "#4ade80" : "#f87171" }}>{t.pnl >= 0 ? "+" : ""}{t.pnl?.toFixed(2)}</td>
              <td style={{ padding: 8 }}>{t.regime}</td>
              <td style={{ padding: 8 }}>{t.exitReason}</td>
            </tr>
          ))}
          {history.length === 0 && <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>Belum ada trade</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Card({ label, value, color }: any) {
  return (
    <div style={{ background: "#111827", borderRadius: 8, padding: 16, border: "1px solid #1f2937" }}>
      <div style={{ fontSize: 12, color: "#9ca3af" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: "bold", color: color || "#fff" }}>{value}</div>
    </div>
  );
}   