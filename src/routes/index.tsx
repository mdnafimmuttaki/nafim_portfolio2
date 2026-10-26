import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, MapPin, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolio } from "@/lib/portfolio";
import { Particles } from "@/components/portfolio/Particles";
import { MusicPlayer } from "@/components/portfolio/MusicPlayer";
import { getPlatform } from "@/components/portfolio/socials";
import bg from "@/assets/bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "nafim — bio" },
      { name: "description", content: "Hi. I'm nafim — links, status and music." },
      { property: "og:title", content: "nafim — bio" },
      { property: "og:description", content: "Hi. I'm nafim — links, status and music." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data, views, setViews } = usePortfolio();
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("viewed")) return;
    sessionStorage.setItem("viewed", "1");
    supabase.rpc("increment_views").then(({ data: v }) => typeof v === "number" && setViews(v));
  }, [setViews]);

  const p = data?.profile;
  const bgUrl = p?.background || bg;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        {p?.backgroundType === "video" && p.background ? (
          <video src={p.background} autoPlay muted loop playsInline className="size-full scale-105 object-cover blur-[2px]" />
        ) : (
          <img src={bgUrl} alt="" className="size-full scale-105 object-cover blur-[2px]" />
        )}
        <div className="absolute inset-0 bg-background/55" />
      </div>
      <Particles kind={p?.particles ?? "snow"} />

      <AnimatePresence>
        {!started && (
          <motion.button
            key="enter"
            onClick={() => setStarted(true)}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur-xl"
          >
            <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2.4 }} className="font-mono text-sm tracking-[0.4em] text-glow">
              CLICK TO ENTER
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Corner controls */}
      <button
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute" : "Mute"}
        className="glass fixed left-4 top-4 z-30 grid size-11 place-items-center rounded-full transition hover:scale-105"
      >
        {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </button>
      <div className="glass fixed right-4 top-4 z-30 flex items-center gap-1.5 rounded-full px-3 py-2 font-mono text-xs">
        <Eye className="size-4" /> {views}
      </div>

      {data && p && (
        <section className="relative z-10 flex min-h-screen items-center justify-center px-4 pb-32 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={started ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="glass w-full max-w-md rounded-3xl p-6 text-center sm:p-8 2xl:max-w-lg"
          >
            <div className="relative mx-auto size-28 rounded-full p-[3px] ring-spin sm:size-32">
              <img src={p.avatar} alt={p.name} className="size-full rounded-full bg-secondary object-cover" />
              <span className="absolute bottom-1.5 right-1.5 size-5 rounded-full border-4 border-card" style={{ background: data.status.color }} />
            </div>

            <h1 className="mt-5 flex items-center justify-center gap-2 text-3xl font-bold tracking-tight text-glow sm:text-4xl">
              {p.name}
              <span className="flex gap-1 text-lg">
                {p.badges.map((b, i) => (
                  <motion.span key={i} whileHover={{ scale: 1.3, rotate: 10 }} className="cursor-default">{b}</motion.span>
                ))}
              </span>
            </h1>
            <p className="mt-2 text-muted-foreground">{p.bio}</p>
            {p.location && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-secondary/70 px-3 py-1 text-xs">
                <MapPin className="size-3.5 text-primary" /> {p.location}
              </span>
            )}

            {/* Presence */}
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-secondary/50 p-3 text-left">
              <div className="relative shrink-0">
                <img src={p.avatar} alt="" className="size-12 rounded-full bg-muted object-cover" />
                <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-secondary" style={{ background: data.status.color }} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold">{data.status.username}</span>
                  {data.status.badges.map((b) => (
                    <span key={b} className="rounded-md bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">{b}</span>
                  ))}
                </div>
                <p className="truncate text-sm text-muted-foreground">{data.status.activity}</p>
              </div>
            </div>

            {/* Socials */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {data.socials.map((s, i) => {
                const pl = getPlatform(s.platform);
                const Icon = pl.icon;
                return (
                  <motion.a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={started ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    whileHover={{ y: -4, scale: 1.12 }}
                    className="group relative grid size-11 place-items-center rounded-xl text-muted-foreground transition-colors"
                    style={{ ["--c" as string]: pl.color }}
                  >
                    <Icon className="size-6 transition-all duration-300 group-hover:text-[var(--c)] group-hover:drop-shadow-[0_0_10px_var(--c)]" />
                    <span className="glass pointer-events-none absolute -top-9 whitespace-nowrap rounded-md px-2 py-1 text-[11px] text-foreground opacity-0 transition group-hover:opacity-100">
                      {s.label || pl.label}
                    </span>
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
        </section>
      )}

      {data && <MusicPlayer music={data.music} muted={muted} started={started} />}
    </main>
  );
}
