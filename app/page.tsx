import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { GazeMesh } from "@/components/GazeMesh";

const DETECTORS = [
  { key: "eyeGaze", label: "Eye gaze", color: "var(--iris)", desc: "Calibration-free look-away, learned from the candidate's own neutral gaze." },
  { key: "headMovement", label: "Head movement", color: "var(--scan)", desc: "Absolute 3D head pose — no calibration, works the first frame." },
  { key: "multiplePerson", label: "Multiple people", color: "var(--warn)", desc: "Flags a second person even when only partially in frame." },
  { key: "device", label: "Phone & notes", color: "var(--bad)", desc: "Detects phones and books in view, including partial glimpses." },
  { key: "faceDetection", label: "Face presence", color: "var(--ok)", desc: "Knows when the candidate leaves the frame or turns away entirely." },
];

const STEPS = [
  { n: "01", h: "Learn neutral", p: "On start, it watches a few seconds of the candidate looking at the screen and learns their neutral gaze — no dot-clicking calibration." },
  { n: "02", h: "Track deviation", p: "Every frame it measures how far the eyes and head have moved from that neutral, smoothed and de-jittered." },
  { n: "03", h: "Flag sustained", p: "A look-away only becomes an event once it holds past your threshold — short glances never fire, so alerts stay meaningful." },
];

const INSTALL = `npm i proctor-vision @mediapipe/tasks-vision`;

export default function Landing() {
  return (
    <>
      <Nav />

      {/* HERO — the technology is the thesis */}
      <header style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 40, alignItems: "center", minHeight: "min(680px, 82vh)", padding: "56px 24px" }}>
          <div>
            <span className="eyebrow">client-side · no server video</span>
            <h1 style={{ fontSize: "clamp(38px, 6vw, 64px)", margin: "18px 0 20px" }}>
              Proctoring that runs<br />in the <span style={{ color: "var(--iris)" }}>browser</span>.
            </h1>
            <p className="muted" style={{ fontSize: 18, maxWidth: 520, margin: "0 0 30px" }}>
              Gaze, head-pose, multiple-person and device detection on MediaPipe — calibration-free,
              framework-agnostic, and TypeScript-first. The candidate&rsquo;s video never leaves their device.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/demo" className="btn btn-primary">Try the live demo →</Link>
              <Link href="/docs" className="btn btn-ghost">Read the docs</Link>
            </div>
            <div className="code" style={{ marginTop: 28, maxWidth: 460 }}>
              <div className="code-bar"><span className="code-dot" style={{ background: "#ff5f56" }} /><span className="code-dot" style={{ background: "#ffbd2e" }} /><span className="code-dot" style={{ background: "#27c93f" }} /></div>
              <pre><span className="tok-com"># install</span>{"\n"}<span className="mono">{INSTALL}</span></pre>
            </div>
          </div>
          <div style={{ position: "relative", height: "min(560px, 70vh)" }}>
            <GazeMesh />
            <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".12em", color: "var(--muted)" }}>
              gaze · head-pose · presence
            </div>
          </div>
        </div>
      </header>

      {/* WHAT IT WATCHES */}
      <section>
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Signals</span>
            <h2>Five detectors, one uniform dial.</h2>
            <p>Every detector has an <code className="mono">enabled</code> flag and a single <code className="mono">sensitivity</code> (0&ndash;1). Turn any off, tune the rest — the same knob everywhere.</p>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {DETECTORS.map((d) => (
              <div key={d.key} className="card">
                <span className="tag"><span className="dot" style={{ background: d.color }} />{d.key}</span>
                <h3>{d.label}</h3>
                <p>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — a real 3-step sequence */}
      <section>
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Calibration-free</span>
            <h2>How the auto-baseline works.</h2>
            <p>No dot-clicking setup. It calibrates itself from the candidate&rsquo;s own attention, then only flags sustained look-aways.</p>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {STEPS.map((s) => (
              <div key={s.n} className="card">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--scan)", marginBottom: 12 }}>{s.n}</div>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATION */}
      <section>
        <div className="wrap" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 40, alignItems: "center" }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow">Integration</span>
            <h2>Five lines to live.</h2>
            <p>Headless engine + typed events. Point it at a <code className="mono">&lt;video&gt;</code> or a MediaStream, listen, and render however you like. An optional vanilla UI and a React hook ship too.</p>
            <div style={{ marginTop: 22, display: "flex", gap: 12 }}>
              <Link href="/docs" className="btn btn-ghost">Full API →</Link>
            </div>
          </div>
          <div className="code">
            <div className="code-bar"><span className="code-dot" style={{ background: "#ff5f56" }} /><span className="code-dot" style={{ background: "#ffbd2e" }} /><span className="code-dot" style={{ background: "#27c93f" }} /><span style={{ marginLeft: 8, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>proctor.ts</span></div>
            <pre>
<span className="tok-key">import</span> {"{ createProctor }"} <span className="tok-key">from</span> <span className="tok-str">&quot;proctor-vision&quot;</span>;{"\n\n"}
<span className="tok-key">const</span> proctor = <span className="tok-fn">createProctor</span>({"{"}{"\n"}
{"  "}features: {"{"}{"\n"}
{"    "}eyeGaze:{"        "}{"{ enabled: "}<span className="tok-key">true</span>{", sensitivity: "}<span className="tok-num">0.5</span>{" },"}{"\n"}
{"    "}headMovement:{"   "}{"{ enabled: "}<span className="tok-key">true</span>{", sensitivity: "}<span className="tok-num">0.5</span>{" },"}{"\n"}
{"    "}multiplePerson:{" "}{"{ enabled: "}<span className="tok-key">true</span>{", sensitivity: "}<span className="tok-num">0.6</span>{" },"}{"\n"}
{"    "}device:{"         "}{"{ enabled: "}<span className="tok-key">true</span>{", sensitivity: "}<span className="tok-num">0.7</span>{" },"}{"\n"}
{"  "}{"},"}{"\n"}
{"}"});{"\n\n"}
proctor.<span className="tok-fn">on</span>(<span className="tok-str">&quot;prolonged&quot;</span>, (e) =&gt; <span className="tok-fn">showBanner</span>(e.message));{"\n"}
<span className="tok-key">await</span> proctor.<span className="tok-fn">start</span>(videoEl);{"\n"}
<span className="tok-key">const</span> report = proctor.<span className="tok-fn">getReport</span>();  <span className="tok-com">// evidence for review</span>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center" }}>
        <div className="wrap">
          <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", marginBottom: 14 }}>See it track your gaze in real time.</h2>
          <p className="muted" style={{ fontSize: 17, maxWidth: 520, margin: "0 auto 28px" }}>
            The demo runs entirely in your browser. Nothing is uploaded — allow the camera and watch the signals live.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/demo" className="btn btn-primary">Launch the demo →</Link>
            <a href="https://github.com/Arpanoob/proctor-vision" target="_blank" rel="noreferrer" className="btn btn-ghost">Star on GitHub</a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
