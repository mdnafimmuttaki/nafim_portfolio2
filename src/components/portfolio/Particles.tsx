import { useEffect, useRef } from "react";

export function Particles({ kind }: { kind: "snow" | "stars" | "dust" | "none" }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (kind === "none") return;
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = (c.width = window.innerWidth);
    let h = (c.height = window.innerHeight);
    const count = kind === "stars" ? 160 : kind === "dust" ? 70 : 140;
    const ps = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * (kind === "snow" ? 2.4 : 1.4) + 0.4,
      vx: (Math.random() - 0.5) * 0.4,
      vy: kind === "snow" ? Math.random() * 0.8 + 0.3 : (Math.random() - 0.5) * 0.15,
      t: Math.random() * Math.PI * 2,
    }));
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.t += 0.02;
        p.x += p.vx + (kind === "snow" ? Math.sin(p.t) * 0.3 : 0);
        p.y += p.vy;
        if (p.y > h) p.y = -5;
        if (p.y < -5) p.y = h;
        if (p.x > w) p.x = 0;
        if (p.x < 0) p.x = w;
        const a = kind === "stars" ? 0.4 + Math.sin(p.t) * 0.4 : kind === "dust" ? 0.35 : 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = kind === "dust" ? `rgba(255,230,190,${a})` : `rgba(255,255,255,${a})`;
        ctx.fill();
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
  }, [kind]);
  if (kind === "none") return null;
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[1]" />;
}
