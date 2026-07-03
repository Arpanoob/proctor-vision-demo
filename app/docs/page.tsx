import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata = { title: "proctor-vision — Documentation" };

const NAV = [
  ["install", "Install"], ["quick-start", "Quick start"], ["detectors", "Detectors & sensitivity"],
  ["events", "Events"], ["state", "Live state"], ["report", "Session report"],
  ["react", "React / Next.js"], ["environment", "Best-use guidance"], ["privacy", "Privacy & limits"],
] as const;

export default function Docs() {
  return (
    <>
      <Nav />
      <div className="wrap" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 48, padding: "48px 24px", alignItems: "start" }}>
        {/* sidebar */}
        <aside style={{ position: "sticky", top: 84, fontSize: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Documentation</div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="muted" style={{ transition: "color .15s" }}>{label}</a>
            ))}
          </nav>
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/demo" className="muted">Live demo →</Link>
            <a href="https://www.npmjs.com/package/proctor-vision" target="_blank" rel="noreferrer" className="muted">npm →</a>
          </div>
        </aside>

        {/* content */}
        <main className="docs" style={{ maxWidth: 760, minWidth: 0 }}>
          <h1 style={{ fontSize: 40, marginBottom: 10 }}>Documentation</h1>
          <p className="muted" style={{ fontSize: 17, marginTop: 0 }}>
            A calibration-free, client-side proctoring engine built on MediaPipe. Headless and
            framework-agnostic; an optional vanilla UI and React hook ship alongside.
          </p>

          <Doc id="install" title="Install">
            <p>Install the package and its MediaPipe peer dependency:</p>
            <Code>{`npm i proctor-vision @mediapipe/tasks-vision`}</Code>
            <p className="muted">Runs only in the browser, over <b>HTTPS or localhost</b> (camera requirement). Ships ESM + CJS + types.</p>
          </Doc>

          <Doc id="quick-start" title="Quick start">
            <Code>{`import { createProctor } from "proctor-vision";

const proctor = createProctor({
  features: {
    faceDetection:  { enabled: true, sensitivity: 0.5 },
    eyeGaze:        { enabled: true, sensitivity: 0.5, prolongedMs: 5000 },
    headMovement:   { enabled: true, sensitivity: 0.5, prolongedMs: 5000 },
    multiplePerson: { enabled: true, sensitivity: 0.6 },
    device:         { enabled: true, sensitivity: 0.7, watch: ["cell phone", "book"] },
  },
});

proctor.on("violation",    e => console.log(e.type, e.message));
proctor.on("prolonged",    e => showBanner(e.message));   // fires at prolongedMs
proctor.on("violationEnd", e => save(e));                 // { type, durationMs, prolonged }

await proctor.start(videoElement);   // an HTMLVideoElement or MediaStream
// ... later
const report = proctor.getReport();
proctor.stop();`}</Code>
          </Doc>

          <Doc id="detectors" title="Detectors & sensitivity">
            <p>Every detector shares one shape: <code className="mono">{`{ enabled, sensitivity }`}</code> plus optional extras.
              <b> sensitivity is a single 0&ndash;1 dial — higher = more sensitive</b> (flags more readily). The SDK maps it
              to the right internal threshold, so you tune one number per detector.</p>
            <table className="tbl">
              <thead><tr><th>Detector</th><th>sensitivity controls</th><th>Extras</th><th>Default</th></tr></thead>
              <tbody>
                <tr><td>faceDetection</td><td>how eagerly a face is detected</td><td>message</td><td>0.5</td></tr>
                <tr><td>eyeGaze</td><td>how small a glance off-screen counts</td><td>prolongedMs, message</td><td>0.5</td></tr>
                <tr><td>headMovement</td><td>how small a head turn counts</td><td>prolongedMs, message</td><td>0.5</td></tr>
                <tr><td>multiplePerson</td><td>how partial a 2nd person counts</td><td>message</td><td>0.6</td></tr>
                <tr><td>device</td><td>how partial a device counts</td><td>watch[], prolongedMs, message</td><td>0.7</td></tr>
              </tbody>
            </table>
            <p>All default to <code className="mono">enabled: true</code>. Turn one off with <code className="mono">enabled: false</code>. Change any dial live:</p>
            <Code>{`proctor.configure({ features: { device: { sensitivity: 0.9 } } });`}</Code>
            <p className="muted">Globals: <code className="mono">autoBaseline</code> (true), <code className="mono">smoothing</code> (0.25), <code className="mono">headSmoothing</code> (0.4), <code className="mono">objectDetectIntervalMs</code> (400), <code className="mono">maxFaces</code> (3), <code className="mono">debug</code> (false), <code className="mono">modelBaseUrl</code> (self-host models).</p>
          </Doc>

          <Doc id="events" title="Events">
            <table className="tbl">
              <thead><tr><th>Event</th><th>Payload</th><th>When</th></tr></thead>
              <tbody>
                <tr><td>violation</td><td>{`{ type, direction?, message, startedAt }`}</td><td>an episode begins (after debounce)</td></tr>
                <tr><td>prolonged</td><td>{`{ type, message, thresholdMs }`}</td><td>episode reaches prolongedMs</td></tr>
                <tr><td>violationEnd</td><td>{`{ type, durationMs, prolonged }`}</td><td>episode ends</td></tr>
                <tr><td>state</td><td>ProctorState</td><td>every processed frame</td></tr>
                <tr><td>started / stopped / error</td><td>— / — / Error</td><td>lifecycle</td></tr>
              </tbody>
            </table>
            <p><code className="mono">type</code> is one of <code className="mono">eyeGaze | headMovement | multiplePerson | device | noFace</code>.</p>
          </Doc>

          <Doc id="state" title="Live state">
            <p>The <code className="mono">state</code> event fires each frame with a snapshot you can render into a HUD:</p>
            <Code>{`proctor.on("state", s => {
  s.faces;            // number of faces
  s.gazeDirection;    // "CENTER" | "LEFT" | "DOWN-RIGHT" | ...
  s.head;             // { yawDeg, pitchDeg }
  s.devices;          // [{ label, score }]
  s.baselineReady;    // has the neutral gaze been learned yet
  s.active;           // which detectors are currently firing
});`}</Code>
            <p className="muted">Set <code className="mono">debug: true</code> to also receive <code className="mono">landmarks</code> and <code className="mono">deviceBoxes</code> for a mesh overlay (use <code className="mono">drawDebugOverlay</code> from <code className="mono">proctor-vision/ui</code>).</p>
          </Doc>

          <Doc id="report" title="Session report">
            <p><code className="mono">getReport()</code> returns proctoring evidence — a summary plus every episode with durations and timestamps. Meant to be <b>flagged for human review, not an automatic verdict.</b></p>
            <Code>{`{
  durationSeconds, mode, config,
  summary: { countsByType, totalSecondsByType, prolongedEpisodes, totalViolations },
  episodes: [{ type, direction, durationMs, prolonged, startedAt, endedAt }]
}`}</Code>
          </Doc>

          <Doc id="react" title="React / Next.js">
            <p>Create the engine in an effect, point it at a video ref, clean up on unmount. The demo ships a ready-made <code className="mono">useProctorVision</code> hook.</p>
            <Code>{`const proctor = createProctor(config);
useEffect(() => {
  proctor.on("state", setState);
  proctor.start(videoRef.current!);
  return () => proctor.stop();
}, []);`}</Code>
          </Doc>

          <Doc id="environment" title="Best-use guidance">
            <p>For the most reliable gaze/head detection, guide candidates on their setup:</p>
            <table className="tbl">
              <thead><tr><th>Factor</th><th>Recommendation</th></tr></thead>
              <tbody>
                <tr><td>Distance</td><td><b>~50&ndash;60&nbsp;cm</b> (20&ndash;24 in); acceptable 40&ndash;75&nbsp;cm</td></tr>
                <tr><td>Framing</td><td>Face ≈ <b>⅓ of the frame</b>, whole head + shoulders, centered</td></tr>
                <tr><td>Camera height</td><td>At <b>eye level</b> (±15°)</td></tr>
                <tr><td>Lighting</td><td>Even, front-facing; avoid backlight (window behind)</td></tr>
                <tr><td>Glasses</td><td>✅ Fully supported — just avoid strong lens glare</td></tr>
              </tbody>
            </table>
            <p><b>Glasses:</b> work out of the box — MediaPipe is trained on faces with glasses, head-pose is geometric (lens-independent), and the auto-baseline learns the wearer&rsquo;s neutral as-is. The only degrader is strong glare on the lenses washing out the iris for gaze; head-pose, person and device detection are unaffected regardless.</p>
          </Doc>

          <Doc id="privacy" title="Privacy & limits">
            <ul style={{ color: "var(--muted)", paddingLeft: 20, lineHeight: 1.8 }}>
              <li><b>All video stays in the browser</b> — the SDK never uploads frames. Only the events/report you choose to persist leave the device.</li>
              <li><b>A fully-hidden phone can&rsquo;t be seen</b> by any webcam detector — the sustained eyes/head-down signal is the behavioral backstop.</li>
              <li><b>Treat output as evidence for a human</b>, not an automatic pass/fail.</li>
              <li>GPU is used when available; otherwise it falls back to CPU (slower FPS).</li>
            </ul>
          </Doc>

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--line)", display: "flex", gap: 12 }}>
            <Link href="/demo" className="btn btn-primary">Try the live demo →</Link>
            <a href="https://github.com/Arpanoob/proctor-vision" target="_blank" rel="noreferrer" className="btn btn-ghost">GitHub</a>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

function Doc({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ padding: "28px 0", border: "none", borderTop: "1px solid var(--line)", marginTop: 8 }}>
      <h2 style={{ fontSize: 26, marginBottom: 14, scrollMarginTop: 84 }}>{title}</h2>
      {children}
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <div className="code" style={{ margin: "14px 0" }}>
      <div className="code-bar"><span className="code-dot" style={{ background: "#ff5f56" }} /><span className="code-dot" style={{ background: "#ffbd2e" }} /><span className="code-dot" style={{ background: "#27c93f" }} /></div>
      <pre><code className="mono">{children}</code></pre>
    </div>
  );
}
