"use client";
import { useEffect } from "react";

/**
 * MediaPipe's WASM prints benign INFO lines (e.g. "Created TensorFlow Lite XNNPACK
 * delegate for CPU") to stderr, which Next.js's dev error overlay wrongly elevates to
 * a red error. This filters ONLY those exact benign MediaPipe INFO messages so the
 * overlay stops firing. Real errors are untouched. Dev-quality-of-life only.
 */
export function SuppressMediapipeInfo() {
  useEffect(() => {
    const orig = console.error;
    const BENIGN = ["XNNPACK delegate", "Created TensorFlow Lite", "GL version", "OpenGL error checking"];
    console.error = (...args: unknown[]) => {
      const first = typeof args[0] === "string" ? args[0] : (args[0] instanceof Error ? args[0].message : "");
      if (BENIGN.some((s) => first.includes(s))) return; // swallow benign MediaPipe INFO
      orig(...args);
    };
    return () => { console.error = orig; };
  }, []);
  return null;
}
