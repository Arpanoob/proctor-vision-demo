"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useProctorVision } from "@/hooks/use-proctor-vision";
import { drawDebugOverlay } from "proctor-vision/ui";
import type { ProctorConfig } from "proctor-vision";

const LABELS: Record<string, string> = {
  eyeGaze: "Eyes off screen", headMovement: "Head turned",
  multiplePerson: "Multiple people", device: "Device", noFace: "No face",
};

type FeatKey = "faceDetection" | "eyeGaze" | "headMovement" | "multiplePerson" | "device";
const FEATURES: { key: FeatKey; label: string }[] = [
  { key: "faceDetection", label: "Face detection" },
  { key: "eyeGaze", label: "Eye gaze" },
  { key: "headMovement", label: "Head movement" },
  { key: "multiplePerson", label: "Multiple person" },
  { key: "device", label: "Device / phone" },
];

export default function Home() {
  // Per-feature enable + sensitivity (0..1, higher = more sensitive) — the uniform API.
  const [feat, setFeat] = useState<Record<FeatKey, { enabled: boolean; sensitivity: number }>>({
    faceDetection: { enabled: true, sensitivity: 0.5 },
    eyeGaze: { enabled: true, sensitivity: 0.5 },
    headMovement: { enabled: true, sensitivity: 0.5 },
    multiplePerson: { enabled: true, sensitivity: 0.6 },
    device: { enabled: true, sensitivity: 0.7 },
  });
  const [prolongedS, setProlongedS] = useState(5);
  const [debug, setDebug] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const config: ProctorConfig = useMemo(() => ({
    debug: true,
    features: {
      faceDetection: { enabled: feat.faceDetection.enabled, sensitivity: feat.faceDetection.sensitivity },
      eyeGaze: { enabled: feat.eyeGaze.enabled, sensitivity: feat.eyeGaze.sensitivity, prolongedMs: prolongedS * 1000 },
      headMovement: { enabled: feat.headMovement.enabled, sensitivity: feat.headMovement.sensitivity, prolongedMs: prolongedS * 1000 },
      multiplePerson: { enabled: feat.multiplePerson.enabled, sensitivity: feat.multiplePerson.sensitivity },
      device: { enabled: feat.device.enabled, sensitivity: feat.device.sensitivity, prolongedMs: prolongedS * 1000 },
    },
  }), [feat, prolongedS]);

  const proctor = useProctorVision(config);
  const { videoRef, start, stop, getReport, configure, state, prolonged, toast, alerts, running, error } = proctor;

  // Push config changes to the running engine live.
  useEffect(() => { configure(config); }, [config, configure]);

  // Collapse the settings panel by default on small screens (it covers the video).
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 720) setShowPanel(false);
  }, []);

  // Debug mesh overlay
  useEffect(() => {
    const canvas = overlayRef.current, video = videoRef.current;
    if (!canvas) return;
    if (!debug || !state) { canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height); return; }
    if (video?.videoWidth && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    }
    drawDebugOverlay(canvas, state, { mesh: true, boxes: true });
  }, [state, debug, videoRef]);

  const download = () => {
    const report = getReport();
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `proctoring-report-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(a.href);
  };

  const setEnabled = (k: FeatKey, v: boolean) => setFeat((p) => ({ ...p, [k]: { ...p[k], enabled: v } }));
  const setSens = (k: FeatKey, v: number) => setFeat((p) => ({ ...p, [k]: { ...p[k], sensitivity: v } }));

  const active = state?.active ?? [];
  const pill = active.length ? "bad" : running && state?.baselineReady ? "ok" : "warn";
  const pillText = active.length ? active.map((t) => LABELS[t]).join(" · ")
    : !running ? "Idle" : state?.baselineReady ? "Proctoring: OK" : "Learning neutral…";

  return (
    <main style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
      <video ref={videoRef} autoPlay playsInline muted
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", background: "#000" }} />
      <canvas ref={overlayRef}
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", zIndex: 1, pointerEvents: "none", display: debug ? "block" : "none" }} />
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.6), transparent 20%, transparent 70%, rgba(0,0,0,.7))", pointerEvents: "none" }} />

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", zIndex: 5 }}>
        <a href="/" style={{ fontWeight: 700 }}>← proctor-vision <span style={{ opacity: .6, fontWeight: 500 }}>· live demo</span></a>
        <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setShowPanel((v) => !v)} title="Toggle detector settings"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#fff",
              background: showPanel ? "rgba(124,92,255,.25)" : "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 8, padding: "6px 10px" }}>
            ⚙ <span className="tog-label">Detectors</span>
          </button>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} /> <span className="tog-label">Debug mesh</span>
          </label>
          <span style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 999, fontWeight: 700, fontSize: 13,
            background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)",
            color: pill === "bad" ? "#ffb3ae" : pill === "warn" ? "#ffd98a" : "#fff" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: pill === "bad" ? "#f85149" : pill === "warn" ? "#d29922" : "#2ea043" }} />
            {pillText}
          </span>
        </span>
      </div>

      {prolonged && <div style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", zIndex: 7, background: "rgba(248,81,73,.95)", color: "#fff", fontWeight: 800, padding: "10px 20px", borderRadius: 10 }}>⚠ {prolonged}</div>}
      {toast && !prolonged && <div style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", zIndex: 6, background: "rgba(210,153,34,.95)", color: "#1a1200", fontWeight: 700, padding: "8px 18px", borderRadius: 10 }}>{toast}</div>}

      <div className="demo-ai" style={{ position: "fixed", left: 22, bottom: 96, zIndex: 5, width: 320, maxWidth: "70vw", background: "rgba(16,18,28,.72)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #a48bff, #5a3fd6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>AI</div>
          <div><div style={{ fontWeight: 700, fontSize: 14 }}>Aria — AI Interviewer</div><div style={{ fontSize: 12, opacity: .6 }}>Question 3 of 10</div></div>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.45 }}>Tell me about a challenging project and how you handled it.</div>
      </div>

      {/* Camera-check hint before the session starts */}
      {!running && (
        <div style={{ position: "fixed", top: "42%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 6, textAlign: "center", background: "rgba(16,18,28,.8)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 14, padding: "18px 24px", maxWidth: 460 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Camera check</div>
          <div style={{ fontSize: 13, opacity: .8, lineHeight: 1.5 }}>
            Sit <b>~50–60&nbsp;cm</b> from the camera (face fills about a third of the frame), keep it at
            <b> eye level</b>, and make sure your face is <b>evenly lit</b> (no window behind you).
            Glasses are fine — just avoid strong glare on the lenses.
          </div>
        </div>
      )}

      <div style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 6, display: "flex", gap: 12 }}>
        {!running ? <button onClick={start} style={btn("#7c5cff")}>Start interview</button> : <button onClick={stop} style={btn("#f85149")}>End</button>}
        <button onClick={download} disabled={!running} style={btn("#30363d")}>Download report</button>
      </div>

      {/* Per-feature control panel: enable + sensitivity for EVERY detector */}
      {showPanel && (
      <div className="demo-panel" style={{ position: "fixed", top: 62, right: 22, zIndex: 7, width: 300, background: "rgba(16,18,28,.92)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: 14, fontSize: 12.5, maxHeight: "82vh", overflowY: "auto" }}>
        <div style={{ textTransform: "uppercase", letterSpacing: ".6px", opacity: .6, fontSize: 11, marginBottom: 8 }}>Detectors — enable + sensitivity</div>
        {FEATURES.map(({ key, label }) => (
          <div key={key} style={{ borderTop: "1px solid rgba(255,255,255,.08)", padding: "8px 0" }}>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontWeight: 600 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={feat[key].enabled} onChange={(e) => setEnabled(key, e.target.checked)} />
                {label}
              </span>
              <span style={{ opacity: .6, fontVariantNumeric: "tabular-nums" }}>{feat[key].sensitivity.toFixed(2)}</span>
            </label>
            <input type="range" min={0} max={1} step={0.01} value={feat[key].sensitivity}
              disabled={!feat[key].enabled}
              onChange={(e) => setSens(key, parseFloat(e.target.value))}
              style={{ width: "100%", marginTop: 4, opacity: feat[key].enabled ? 1 : 0.4 }} />
          </div>
        ))}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", padding: "8px 0" }}>
          <label style={{ opacity: .8 }}>Prolonged alert after: <b>{prolongedS}s</b>
            <input type="range" min={1} max={15} step={1} value={prolongedS} onChange={(e) => setProlongedS(parseInt(e.target.value))} style={{ width: "100%" }} />
          </label>
        </div>

        <div style={{ textTransform: "uppercase", letterSpacing: ".6px", opacity: .6, fontSize: 11, margin: "10px 0 6px" }}>Live</div>
        <Row k="Baseline" v={state?.baselineReady ? "ready" : "learning…"} />
        <Row k="Faces" v={String(state?.faces ?? "—")} />
        <Row k="Gaze" v={state ? state.gazeDirection + (state.blinking ? " (blink)" : "") : "—"} />
        <Row k="Head yaw/pitch" v={state ? `${state.head.yawDeg.toFixed(0)}° / ${state.head.pitchDeg.toFixed(0)}°` : "—"} />
        <Row k="Devices" v={state?.devices.map((d) => d.label).join(", ") || "none"} />

        <div style={{ textTransform: "uppercase", letterSpacing: ".6px", opacity: .6, fontSize: 11, margin: "10px 0 6px" }}>Alerts</div>
        <div style={{ maxHeight: 130, overflowY: "auto", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, lineHeight: 1.5, background: "rgba(0,0,0,.35)", borderRadius: 8, padding: 6 }}>
          {alerts.length === 0 ? <div style={{ opacity: .5 }}>no alerts yet</div> : alerts.map((a) => (
            <div key={a.id} style={{ color: a.kind === "prolonged" ? "#f85149" : a.kind === "end" ? "#2ea043" : "#d29922" }}>
              <span style={{ opacity: .5 }}>[{a.time}]</span> {a.message}
            </div>
          ))}
        </div>
      </div>
      )}

      {error && <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", zIndex: 8, background: "#f85149", color: "#fff", padding: "8px 16px", borderRadius: 8 }}>Camera error: {error}</div>}
    </main>
  );
}

function btn(bg: string): React.CSSProperties {
  return { background: bg, color: "#fff", border: "none", padding: "10px 18px", borderRadius: 10, fontWeight: 700, cursor: "pointer" };
}
function Row({ k, v }: { k: string; v: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span style={{ opacity: .6 }}>{k}</span><b>{v}</b></div>;
}
