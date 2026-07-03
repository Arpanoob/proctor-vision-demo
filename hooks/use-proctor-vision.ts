"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createProctor,
  type ProctorConfig,
  type ProctorState,
  type ProctorEngine,
  type ProctorReport,
  type ViolationEvent,
  type ViolationEndEvent,
} from "proctor-vision";

export interface AlertEntry {
  id: number;
  kind: "start" | "end" | "prolonged";
  type: string;
  message: string;
  time: string;
}

export interface UseProctorVision {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  start: () => Promise<void>;
  stop: () => void;
  getReport: () => ProctorReport | undefined;
  configure: (patch: ProctorConfig) => void;
  state: ProctorState | null;
  prolonged: string | null;
  toast: string | null;
  alerts: AlertEntry[];
  running: boolean;
  error: string | null;
}

const LABELS: Record<string, string> = {
  eyeLookAway: "Eyes off screen", headTurn: "Head turned",
  multiplePeople: "Multiple people", device: "Device", noFace: "No face",
};
const hhmmss = () => new Date().toTimeString().slice(0, 8);

/** React wrapper around the proctor-vision SDK. Owns the engine lifecycle. */
export function useProctorVision(config?: ProctorConfig): UseProctorVision {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const engineRef = useRef<ProctorEngine | null>(null);
  const [state, setState] = useState<ProctorState | null>(null);
  const [prolonged, setProlonged] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alertId = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const pushAlert = useCallback((a: Omit<AlertEntry, "id" | "time">) => {
    setAlerts((prev) => [{ ...a, id: alertId.current++, time: hhmmss() }, ...prev].slice(0, 50));
  }, []);
  const flashToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const start = useCallback(async () => {
    if (!videoRef.current || engineRef.current?.isRunning()) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const engine = createProctor(config);
      engineRef.current = engine;
      engine.on("state", setState);
      engine.on("violation", (e: ViolationEvent) => {
        const label = LABELS[e.type] ?? e.type;
        flashToast(e.message);
        pushAlert({ kind: "start", type: e.type, message: `${label}${e.direction ? " " + e.direction : ""}${e.detail ? " (" + e.detail + ")" : ""}` });
      });
      engine.on("prolonged", (e) => {
        setProlonged(e.message);
        window.setTimeout(() => setProlonged(null), 2500);
        pushAlert({ kind: "prolonged", type: e.type, message: `⚠ PROLONGED ${LABELS[e.type] ?? e.type} (${Math.round(e.thresholdMs / 1000)}s+)` });
      });
      engine.on("violationEnd", (e: ViolationEndEvent) => {
        if (e.durationMs >= 300) pushAlert({ kind: "end", type: e.type, message: `${LABELS[e.type] ?? e.type} ended — ${(e.durationMs / 1000).toFixed(1)}s${e.prolonged ? " (prolonged)" : ""}` });
        // In production: POST the episode to your backend here.
      });
      engine.on("error", (e) => setError(e.message));

      await engine.start(videoRef.current);
      setRunning(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [config]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    const v = videoRef.current;
    if (v?.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      v.srcObject = null;
    }
    setRunning(false);
  }, []);

  const getReport = useCallback(() => engineRef.current?.getReport(), []);
  const configure = useCallback((patch: ProctorConfig) => engineRef.current?.configure(patch), []);

  useEffect(() => () => { engineRef.current?.stop(); }, []);

  return { videoRef, start, stop, getReport, configure, state, prolonged, toast, alerts, running, error };
}
