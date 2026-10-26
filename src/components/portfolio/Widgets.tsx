import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Quote } from "lucide-react";

/** Rotating typewriter text */
export function Typewriter({ lines }: { lines: string[] }) {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    if (!lines.length) return;
    const full = lines[i % lines.length] ?? "";
    const t = setTimeout(
      () => {
        if (!del && text === full) return setDel(true);
        if (del && text === "") { setDel(false); setI((x) => x + 1); return; }
        setText(del ? full.slice(0, text.length - 1) : full.slice(0, text.length + 1));
      },
      !del && text === full ? 1800 : del ? 35 : 70,
    );
    return () => clearTimeout(t);
  }, [text, del, i, lines]);
  return (
    <span>
      {text}
      <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-primary align-middle" style={{ height: "1em" }} />
    </span>
  );
}

export function LocalClock({ timezone }: { timezone: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return null;
  let s = "";
  try {
    s = now.toLocaleTimeString([], { timeZone: timezone || undefined, hour: "2-digit", minute: "2-digit" });
  } catch {
    s = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/70 px-3 py-1 text-xs">
      <Clock className="size-3.5 text-primary" /> {s}
    </span>
  );
}

export function QuoteCard({ quote, author }: { quote: string; author: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-border bg-secondary/40 p-3 text-left text-sm italic text-muted-foreground">
      <Quote className="mb-1 size-4 text-primary" />
      {quote}
      {author && <span className="mt-1 block text-right font-mono text-[10px] not-italic">— {author}</span>}
    </div>
  );
}

/** Glowing dots that follow the pointer */
export function CursorTrail() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = (c.width = window.innerWidth);
    let h = (c.height = window.innerHeight);
    const pts: { x: number; y: number; life: number }[] = [];
    const color = getComputedStyle(c).color;
    const onMove = (e: MouseEvent) => pts.push({ x: e.clientX, y: e.clientY, life: 1 });
    const onResize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i]!;
        p.life -= 0.035;
        if (p.life <= 0) { pts.splice(i, 1); continue; }
        ctx.globalAlpha = p.life * 0.8;
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.life + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[60] text-primary" />;
}

/** Card that tilts toward the pointer */
export function TiltCard({ enabled, className, children, ...rest }: { enabled: boolean; className?: string; children: React.ReactNode } & React.ComponentProps<typeof motion.div>) {
  const [rot, setRot] = useState({ x: 0, y: 0 });
  return (
    <motion.div
      {...rest}
      className={className}
      style={{ transformPerspective: 900, rotateX: rot.x, rotateY: rot.y }}
      onMouseMove={(e) => {
        if (!enabled) return;
        const r = e.currentTarget.getBoundingClientRect();
        setRot({ x: -((e.clientY - r.top) / r.height - 0.5) * 8, y: ((e.clientX - r.left) / r.width - 0.5) * 8 });
      }}
      onMouseLeave={() => setRot({ x: 0, y: 0 })}
    >
      {children}
    </motion.div>
  );
}
