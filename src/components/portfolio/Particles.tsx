import { useEffect, useRef } from "react";
import type { ParticleKind } from "@/lib/portfolio";

function hexToRgb(hex: string) {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m || m.length < 3) return "255,255,255";
  return m.slice(0, 3).map((x) => parseInt(x, 16)).join(",");
}

export function Particles({ kind, density = 1, color = "#ffffff" }: { kind: ParticleKind; density?: number; color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (kind === "none") return;
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = (c.width = window.innerWidth);
    let h = (c.height = window.innerHeight);
    const rgb = hexToRgb(color);
    const base = { stars: 160, dust: 70, snow: 140, fireflies: 45, rain: 180, sakura: 40, bubbles: 35 }[kind];
    const count = Math.round(base * density);
    const make = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r:
        kind === "sakura" ? Math.random() * 5 + 4
        : kind === "bubbles" ? Math.random() * 14 + 4
        : kind === "fireflies" ? Math.random() * 2 + 1.2
        : Math.random() * (kind === "snow" ? 2.4 : 1.4) + 0.4,
      vx: kind === "rain" ? -0.6 : kind === "sakura" ? Math.random() * 0.8 + 0.2 : (Math.random() - 0.5) * 0.4,
      vy:
        kind === "snow" ? Math.random() * 0.8 + 0.3
        : kind === "rain" ? Math.random() * 6 + 8
        : kind === "sakura" ? Math.random() * 0.8 + 0.5
        : kind === "bubbles" ? -(Math.random() * 0.6 + 0.2)
        : (Math.random() - 0.5) * 0.15,
      t: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI,
    });
    const ps = Array.from({ length: count }, make);
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.t += 0.02;
        p.rot += 0.01;
        p.x += p.vx + (kind === "snow" || kind === "sakura" ? Math.sin(p.t) * 0.3 : 0) + (kind === "fireflies" ? Math.cos(p.t) * 0.4 : 0);
        p.y += p.vy + (kind === "fireflies" ? Math.sin(p.t * 0.7) * 0.4 : 0);
        if (p.y > h + 20) p.y = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.x < -20) p.x = w + 20;
        if (kind === "rain") {
          ctx.strokeStyle = `rgba(${rgb},0.35)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2, p.y + 12);
          ctx.stroke();
          continue;
        }
        if (kind === "sakura") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot + Math.sin(p.t));
          ctx.fillStyle = `rgba(${rgb},0.75)`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          continue;
        }
        if (kind === "bubbles") {
          ctx.strokeStyle = `rgba(${rgb},0.35)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
          continue;
        }
        const a =
          kind === "stars" ? 0.4 + Math.sin(p.t) * 0.4
          : kind === "fireflies" ? 0.3 + Math.abs(Math.sin(p.t)) * 0.7
          : kind === "dust" ? 0.35 : 0.8;
        if (kind === "fireflies") {
          ctx.shadowBlur = 12;
          ctx.shadowColor = `rgba(${rgb},${a})`;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${a})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => {
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [kind, density, color]);
  if (kind === "none") return null;
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[1]" />;
}
