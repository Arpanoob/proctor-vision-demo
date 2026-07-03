"use client";
import { useEffect, useRef } from "react";

/**
 * Signature visual: an ambient face-mesh constellation with a drifting gaze vector
 * that periodically "locks" onto a target and pings — evoking exactly what the SDK
 * does (real-time face/gaze tracking) without touching the camera.
 * Respects prefers-reduced-motion (renders one static frame).
 */
export function GazeMesh() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Build a face-ish point cloud inside an oval.
    const N = 90;
    const pts: { bx: number; by: number; x: number; y: number; ph: number }[] = [];
    for (let i = 0; i < N; i++) {
      // sample within an oval using rejection
      let x = 0, y = 0;
      for (let k = 0; k < 8; k++) {
        x = Math.random() * 2 - 1; y = Math.random() * 2 - 1;
        if ((x * x) / 0.62 + (y * y) / 0.95 <= 1) break;
      }
      pts.push({ bx: x, by: y, x: 0, y: 0, ph: Math.random() * Math.PI * 2 });
    }
    // iris anchors (two eyes)
    const eyeL = { x: -0.26, y: -0.12 }, eyeR = { x: 0.26, y: -0.12 };

    let t = 0, raf = 0;
    // gaze target drifts; occasionally darts off-center then returns
    let gx = 0, gy = 0, tgx = 0, tgy = 0, nextDart = 120, lock = 0;

    const frame = () => {
      t += 1;
      const cx = W / 2, cy = H * 0.52;
      const scale = Math.min(W, H) * (W > 700 ? 0.42 : 0.5);

      // update gaze target
      if (t > nextDart) {
        const off = Math.random() < 0.5;
        tgx = off ? (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.5) : (Math.random() * 2 - 1) * 0.25;
        tgy = off ? (Math.random() * 2 - 1) * 0.5 : (Math.random() * 2 - 1) * 0.2;
        nextDart = t + 90 + Math.random() * 120;
        lock = off ? 40 : 0; // ping when it goes off-screen
      }
      gx += (tgx - gx) * 0.06; gy += (tgy - gy) * 0.06;
      if (lock > 0) lock--;

      ctx.clearRect(0, 0, W, H);

      // hairline scan sweep
      const scanY = cy - scale + ((t * 1.1) % (scale * 2));
      const grad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      grad.addColorStop(0, "rgba(52,224,196,0)");
      grad.addColorStop(0.5, "rgba(52,224,196,0.06)");
      grad.addColorStop(1, "rgba(52,224,196,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(cx - scale, scanY - 40, scale * 2, 80);

      // compute positions with subtle breathing
      for (const p of pts) {
        const wob = reduce ? 0 : Math.sin(t * 0.02 + p.ph) * 0.012;
        p.x = cx + (p.bx + wob) * scale;
        p.y = cy + (p.by + wob) * scale;
      }
      // mesh lines between near neighbours
      ctx.strokeStyle = "rgba(124,92,255,0.12)";
      ctx.lineWidth = 0.6;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = pts[i]!, b = pts[j]!;
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < (scale * 0.28) ** 2) {
            ctx.globalAlpha = 1 - Math.sqrt(d2) / (scale * 0.28);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      // points
      ctx.fillStyle = "rgba(155,140,220,0.55)";
      for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2); ctx.fill(); }

      // eyes + gaze vector
      for (const e of [eyeL, eyeR]) {
        const ex = cx + e.x * scale, ey = cy + e.y * scale;
        const ix = ex + gx * scale * 0.06, iy = ey + gy * scale * 0.06;
        ctx.strokeStyle = "rgba(231,236,243,0.25)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(ex, ey, scale * 0.055, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = lock > 0 ? "#34e0c4" : "#7c5cff";
        ctx.beginPath(); ctx.arc(ix, iy, scale * 0.02, 0, Math.PI * 2); ctx.fill();
      }
      // gaze direction ray from between the eyes
      const ox = cx, oy = cy - 0.12 * scale;
      const rx = ox + gx * scale * 0.9, ry = oy + gy * scale * 0.9;
      ctx.strokeStyle = lock > 0 ? "rgba(52,224,196,0.7)" : "rgba(124,92,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(rx, ry); ctx.stroke();
      // target reticle
      ctx.strokeStyle = lock > 0 ? "#34e0c4" : "rgba(124,92,255,0.6)";
      const rr = lock > 0 ? 8 + (40 - lock) * 0.4 : 6;
      ctx.beginPath(); ctx.arc(rx, ry, rr, 0, Math.PI * 2); ctx.stroke();

      if (!reduce) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} aria-hidden />;
}
