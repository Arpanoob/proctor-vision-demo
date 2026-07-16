/**
 * Visual-risk model — the intelligence layer ServdYou builds on top of the raw
 * proctor-vision episodes (SU-118). Pure + self-contained: it takes a
 * ProctorReport and derives per-detector risk bands, concurrent-violation
 * escalation, and an overall compliance verdict. No backend dependency.
 */
import type { ProctorReport, Episode } from "proctor-vision";

export type RiskBand = "No Risk" | "Low Risk" | "High Risk";
export type Metric =
  | "eyeGaze"
  | "headMovement"
  | "multiplePerson"
  | "noFace"
  | "device";

/** Count at which a detector becomes High Risk (below it, and >0, is Low Risk). */
const HIGH_AT: Record<Metric, number> = {
  eyeGaze: 3,
  headMovement: 3,
  multiplePerson: 2,
  noFace: 2,
  device: 2,
};

/** Fixed display order. */
export const METRICS: Metric[] = [
  "eyeGaze",
  "headMovement",
  "multiplePerson",
  "noFace",
  "device",
];

export const METRIC_LABEL: Record<Metric, string> = {
  eyeGaze: "Eye gaze",
  headMovement: "Head movement",
  multiplePerson: "Multiple people",
  noFace: "No face / off-screen",
  device: "Phone / device",
};

/**
 * eyeGaze & headMovement are only *counted* once sustained (prolonged) — brief,
 * natural glances/turns are noise. Immediate signals (multiplePerson, noFace,
 * device) count every episode.
 */
const PROLONGED_ONLY: ReadonlySet<Metric> = new Set(["eyeGaze", "headMovement"]);

export function riskForMetric(m: Metric, count: number): RiskBand {
  if (count <= 0) return "No Risk";
  return count >= HIGH_AT[m] ? "High Risk" : "Low Risk";
}

export interface MetricInstance {
  startedAt: number;
  durationMs: number;
  prolonged: boolean;
}
export interface MetricSummary {
  key: Metric;
  label: string;
  count: number;
  totalSeconds: number;
  band: RiskBand;
  instances: MetricInstance[];
}
export interface ConcurrentEvent {
  at: number;
  types: Metric[];
}
export interface VisualRisk {
  perMetric: MetricSummary[];
  concurrentEvents: ConcurrentEvent[];
  overall: RiskBand;
  banner: { level: "green" | "orange" | "red"; label: string };
}

const rank = (b: RiskBand) => (b === "High Risk" ? 2 : b === "Low Risk" ? 1 : 0);
const raise = (b: RiskBand): RiskBand =>
  b === "No Risk" ? "Low Risk" : "High Risk";

function countedInstances(episodes: Episode[], m: Metric): MetricInstance[] {
  return episodes
    .filter((e) => e.type === m)
    .filter((e) => (PROLONGED_ONLY.has(m) ? e.prolonged === true : true))
    .map((e) => ({
      startedAt: e.startedAt,
      durationMs: e.durationMs,
      prolonged: e.prolonged,
    }))
    .sort((a, b) => a.startedAt - b.startedAt);
}

/**
 * Concurrent violations: any window where 2+ distinct detectors are active at
 * once (within a 5s merge window). One concurrent window raises overall risk a
 * level; two or more force High Risk.
 */
function detectConcurrent(
  episodes: Episode[],
  windowMs = 5000,
): ConcurrentEvent[] {
  type Pt = { t: number; type: Metric; open: boolean };
  const pts: Pt[] = [];
  for (const e of episodes) {
    if (!METRICS.includes(e.type as Metric)) continue;
    pts.push({ t: e.startedAt, type: e.type as Metric, open: true });
    pts.push({ t: e.endedAt, type: e.type as Metric, open: false });
  }
  pts.sort((a, b) => a.t - b.t || (a.open ? -1 : 1));

  const active = new Map<Metric, number>();
  const events: ConcurrentEvent[] = [];
  let cur: ConcurrentEvent | null = null;

  const distinct = () => [...active.entries()].filter(([, n]) => n > 0).map(([k]) => k);

  for (const p of pts) {
    active.set(p.type, (active.get(p.type) ?? 0) + (p.open ? 1 : -1));
    const types = distinct();
    if (types.length >= 2) {
      if (cur && p.t - cur.at <= windowMs) {
        cur.types = Array.from(new Set([...cur.types, ...types]));
      } else {
        cur = { at: p.t, types: [...types] };
        events.push(cur);
      }
    }
  }
  return events;
}

export function computeVisualRisk(report: ProctorReport | undefined | null): VisualRisk {
  const episodes = report?.episodes ?? [];
  const perMetric: MetricSummary[] = METRICS.map((key) => {
    const instances = countedInstances(episodes, key);
    const count = instances.length;
    const totalSeconds = Math.round(
      instances.reduce((s, i) => s + i.durationMs, 0) / 1000,
    );
    return {
      key,
      label: METRIC_LABEL[key],
      count,
      totalSeconds,
      band: riskForMetric(key, count),
      instances,
    };
  });

  let maxBand: RiskBand = "No Risk";
  for (const m of perMetric) if (rank(m.band) > rank(maxBand)) maxBand = m.band;

  const concurrentEvents = detectConcurrent(episodes);
  let overall = maxBand;
  if (concurrentEvents.length >= 2) overall = "High Risk";
  else if (concurrentEvents.length === 1) overall = raise(maxBand);

  const banner =
    overall === "High Risk"
      ? { level: "red" as const, label: "Major compliance issues" }
      : overall === "Low Risk"
        ? { level: "orange" as const, label: "Minor compliance issues" }
        : { level: "green" as const, label: "No compliance issues" };

  return { perMetric, concurrentEvents, overall, banner };
}

/** Compact duration formatter — "0s", "45s", "1m 20s", "2m". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}s`;
  if (sec === 0) return `${m}m`;
  return `${m}m ${sec}s`;
}
