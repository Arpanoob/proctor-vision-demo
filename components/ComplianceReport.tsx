"use client";
import { useState } from "react";
import type { ProctorReport } from "proctor-vision";
import {
  computeVisualRisk,
  formatDuration,
  type MetricSummary,
  type RiskBand,
} from "@/lib/vision-risk";

const BAND_STYLE: Record<RiskBand, { fg: string; bg: string }> = {
  "No Risk": { fg: "#7ee2a8", bg: "rgba(46,160,67,.18)" },
  "Low Risk": { fg: "#ffd98a", bg: "rgba(210,153,34,.20)" },
  "High Risk": { fg: "#ffb3ae", bg: "rgba(248,81,73,.20)" },
};
const BANNER_STYLE = {
  green: { fg: "#7ee2a8", bg: "rgba(46,160,67,.14)", bd: "rgba(46,160,67,.5)", dot: "#2ea043" },
  orange: { fg: "#ffd98a", bg: "rgba(210,153,34,.14)", bd: "rgba(210,153,34,.5)", dot: "#d29922" },
  red: { fg: "#ffb3ae", bg: "rgba(248,81,73,.14)", bd: "rgba(248,81,73,.5)", dot: "#f85149" },
};

function fmtTime(ms: number): string {
  try {
    return new Date(ms).toLocaleTimeString("en-US", { hour12: false });
  } catch {
    return String(ms);
  }
}

function Card({ m }: { m: MetricSummary }) {
  const [open, setOpen] = useState(false);
  const s = BAND_STYLE[m.band];
  const expandable = m.instances.length > 0;
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "12px 14px", background: "rgba(255,255,255,.02)" }}>
      <button
        onClick={() => expandable && setOpen((v) => !v)}
        style={{ all: "unset", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: expandable ? "pointer" : "default" }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{m.label}</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
            {m.count === 0
              ? "No occurrences detected"
              : `${m.count} event${m.count === 1 ? "" : "s"} · ${formatDuration(m.totalSeconds)} total`}
          </div>
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 999, color: s.fg, background: s.bg }}>{m.band}</span>
          {expandable && <span style={{ opacity: 0.5, fontSize: 12 }}>{open ? "▲" : "▼"}</span>}
        </span>
      </button>
      {open && expandable && (
        <div style={{ marginTop: 10, maxHeight: 180, overflowY: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.55 }}>
                <th style={{ padding: "4px 6px", fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: "4px 6px", fontWeight: 600 }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {m.instances.map((i, idx) => (
                <tr key={idx} style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
                  <td style={{ padding: "4px 6px", fontFamily: "ui-monospace, Menlo, monospace", opacity: 0.8 }}>{fmtTime(i.startedAt)}</td>
                  <td style={{ padding: "4px 6px" }}>{formatDuration(Math.round(i.durationMs / 1000))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ComplianceReport({
  report,
  onClose,
  onDownload,
}: {
  report: ProctorReport;
  onClose: () => void;
  onDownload: () => void;
}) {
  const risk = computeVisualRisk(report);
  const b = BANNER_STYLE[risk.banner.level];

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 20, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(560px, 96vw)", maxHeight: "88vh", overflowY: "auto", background: "rgba(16,18,28,.98)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, padding: 20, color: "#fff" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Compliance Report</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              Risk intelligence layered on the raw SDK episodes · {report.durationSeconds}s session
            </div>
          </div>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", opacity: 0.6, fontSize: 20, lineHeight: 1 }} aria-label="Close">×</button>
        </div>

        {/* Overall compliance banner */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 12, padding: "12px 14px", background: b.bg, border: `1px solid ${b.bd}`, marginBottom: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: b.dot, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: b.fg }}>{risk.banner.label}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Overall visual risk: <b>{risk.overall}</b>
              {risk.concurrentEvents.length > 0 && ` · ${risk.concurrentEvents.length} concurrent-violation window${risk.concurrentEvents.length === 1 ? "" : "s"}`}
            </div>
          </div>
        </div>

        {/* Per-detector cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {risk.perMetric.map((m) => (
            <Card key={m.key} m={m} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={onDownload} style={{ background: "#7c5cff", color: "#fff", border: "none", padding: "9px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Download raw JSON</button>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.1)", color: "#fff", border: "1px solid rgba(255,255,255,.18)", padding: "9px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}
