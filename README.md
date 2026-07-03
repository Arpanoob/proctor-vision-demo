# proctor-vision — Next.js demo

A Next.js (App Router) AI-interview mockup that consumes the **published npm SDK**
[`proctor-vision`](https://www.npmjs.com/package/proctor-vision) — calibration-free gaze,
head-pose, multiple-person and device detection, fully client-side.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```
Use **Chrome**, click **Start interview**, look at the screen for ~2s (neutral learns), then it's live.
Camera needs `localhost` or HTTPS (both fine here).

## What it shows
- Full-screen candidate camera (like a real interview)
- Live proctoring status pill + prolonged-violation banner
- AI-interviewer card + Start/End + **Download report** (JSON)
- A tuning panel with live sensitivity / head-tolerance / prolonged sliders

## How it uses the SDK
- `hooks/use-proctor-vision.ts` — a reusable React hook wrapping `createProctor()`, owning the
  engine lifecycle and exposing `state` / `prolonged` / `start` / `stop` / `getReport` / `configure`.
- `app/page.tsx` — the UI, driven purely by the hook's state + events.

This is the same pattern you'd drop into ServdYou's interview flow.
