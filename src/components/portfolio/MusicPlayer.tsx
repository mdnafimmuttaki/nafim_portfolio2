import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward, Music2 } from "lucide-react";
import type { PortfolioData } from "@/lib/portfolio";

const fmt = (s: number) =>
  !isFinite(s) ? "0:00" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function MusicPlayer({
  music, muted, started,
}: { music: PortfolioData["music"]; muted: boolean; started: boolean }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const tracks = music.tracks;
  const track = tracks[idx % Math.max(tracks.length, 1)] as PortfolioData["music"]["tracks"][number] | undefined;

  useEffect(() => {
    const a = new Audio();
    audio.current = a;
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => setDur(a.duration);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    return () => { a.pause(); a.removeEventListener("timeupdate", onTime); a.removeEventListener("loadedmetadata", onMeta); };
  }, []);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    a.onended = () => {
      if (idx < tracks.length - 1 || music.loop) setIdx((i) => (i + 1) % tracks.length);
      else setPlaying(false);
    };
  }, [idx, tracks.length, music.loop]);

  useEffect(() => { if (audio.current) audio.current.volume = music.volume; }, [music.volume]);
  useEffect(() => { if (audio.current) audio.current.muted = muted; }, [muted]);

  useEffect(() => {
    const a = audio.current;
    if (!a || !track) return;
    if (a.src !== track.url) { a.src = track.url; setTime(0); }
    if (playing) a.play().catch(() => setPlaying(false));
  }, [track?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (started) setPlaying(true); }, [started]);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing]);

  if (!track) return null;
  const pct = dur ? (time / dur) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 120 }}
      className="glass fixed bottom-4 left-1/2 z-20 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary">
          {playing ? (
            <div className="flex h-5 items-end gap-[3px]" aria-hidden>
              {[0.9, 0.5, 1, 0.7, 0.4].map((h, i) => (
                <motion.span key={i} className="w-[3px] rounded-full bg-primary"
                  animate={{ height: ["20%", `${h * 100}%`, "35%", `${(1.2 - h) * 80}%`, "20%"] }}
                  transition={{ repeat: Infinity, duration: 0.9 + i * 0.12, ease: "easeInOut" }} />
              ))}
            </div>
          ) : (
            <Music2 className="size-5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{track.title}</p>
          <div
            className="group mt-1.5 h-1.5 cursor-pointer rounded-full bg-secondary"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              if (audio.current && dur) audio.current.currentTime = ((e.clientX - r.left) / r.width) * dur;
            }}
          >
            <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>{fmt(time)}</span><span>{fmt(dur)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button aria-label="Previous" onClick={() => setIdx((i) => (i - 1 + tracks.length) % tracks.length)} className="rounded-full p-2 text-muted-foreground transition hover:text-foreground">
            <SkipBack className="size-4" />
          </button>
          <motion.button whileTap={{ scale: 0.9 }} aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)} className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
            {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
          </motion.button>
          <button aria-label="Next" onClick={() => setIdx((i) => (i + 1) % tracks.length)} className="rounded-full p-2 text-muted-foreground transition hover:text-foreground">
            <SkipForward className="size-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
