import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, MapPin, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FONTS, appearanceOf, usePortfolio, widgetsOf } from "@/lib/portfolio";
import { Particles } from "@/components/portfolio/Particles";
import { MusicPlayer } from "@/components/portfolio/MusicPlayer";
import { ProfileTabs } from "@/components/portfolio/ProfileTabs";
import { Presence } from "@/components/portfolio/Presence";
import { Guestbook } from "@/components/portfolio/Guestbook";
import { CursorTrail, LocalClock, QuoteCard, TiltCard, Typewriter } from "@/components/portfolio/Widgets";
import { getPlatform } from "@/components/portfolio/socials";
import { cn } from "@/lib/utils";
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

const CARD = { glass: "glass", solid: "card-solid", outline: "card-outline", minimal: "" } as const;
const WIDTH = { compact: "max-w-sm", normal: "max-w-md 2xl:max-w-lg", wide: "max-w-xl" } as const;
const SHAPE = { circle: "rounded-full", rounded: "rounded-3xl", square: "rounded-md" } as const;
const FRAME = { spin: "ring-spin", pulse: "ring-pulse", static: "bg-primary", none: "" } as const;

function Index() {
  const { data, views, setViews } = usePortfolio();
  const [entered, setEntered] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("viewed")) return;
    sessionStorage.setItem("viewed", "1");
    supabase.rpc("increment_views").then(({ data: v }) => typeof v === "number" && setViews(v));
  }, [setViews]);

  const p = data?.profile;
  const a = data ? appearanceOf(data) : null;
  const w = data ? widgetsOf(data) : null;
  const started = entered || (a ? !a.showEnter : false);
  const bgUrl = p?.background || bg;

  // User-chosen accent colors feed the design tokens for this page only.
  const themeVars = a
    ? ({ "--glow": a.accent, "--glow-2": a.accent2, "--primary": a.accent, "--ring": a.accent, fontFamily: FONTS[a.font].family } as CSSProperties)
    : undefined;

  return (
    <main className="relative min-h-screen overflow-hidden" style={themeVars}>
      <div className="fixed inset-0 z-0">
        {p?.backgroundType === "video" && p.background ? (
          <video src={p.background} autoPlay muted loop playsInline className="size-full scale-105 object-cover" style={{ filter: `blur(${a?.blur ?? 2}px)` }} />
        ) : (
          <img src={bgUrl} alt="" className="size-full scale-105 object-cover" style={{ filter: `blur(${a?.blur ?? 2}px)` }} />
        )}
        <div className="absolute inset-0 bg-background" style={{ opacity: (a?.overlay ?? 55) / 100 }} />
      </div>
      <Particles kind={p?.particles ?? "snow"} density={a?.particleDensity} color={a?.particleColor} />
      {a?.cursorTrail && <CursorTrail />}

      <AnimatePresence>
        {a && !started && (
          <motion.button
            key="enter"
            onClick={() => setEntered(true)}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur-xl"
          >
            <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2.4 }} className="font-mono text-sm tracking-[0.4em] text-glow">
              {a.enterText || "CLICK TO ENTER"}
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {a?.playerStyle !== "hidden" && (
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
          className="glass fixed left-4 top-4 z-30 grid size-11 place-items-center rounded-full transition hover:scale-105"
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      )}
      {a?.showViews && (
        <div className="glass fixed right-4 top-4 z-30 flex items-center gap-1.5 rounded-full px-3 py-2 font-mono text-xs">
          <Eye className="size-4" /> {views}
        </div>
      )}

      {data && p && a && w && (
        <section className="relative z-10 flex min-h-screen items-center justify-center px-4 pb-32 pt-20">
          <TiltCard
            enabled={a.tilt}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={started ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className={cn("w-full rounded-3xl p-6 text-center sm:p-8", CARD[a.cardStyle], WIDTH[a.cardWidth])}
          >
            <div className={cn("relative mx-auto size-28 p-[3px] sm:size-32", SHAPE[a.avatarShape], FRAME[a.avatarFrame])}>
              <img src={p.avatar} alt={p.name} className={cn("size-full bg-secondary object-cover", SHAPE[a.avatarShape])} />
              <span className="absolute bottom-1.5 right-1.5 size-5 rounded-full border-4 border-card" style={{ background: data.status.color }} />
            </div>

            <h1 className="mt-5 flex items-center justify-center gap-2 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className={a.nameEffect === "glow" ? "text-glow" : a.nameEffect === "gradient" ? "text-gradient" : ""}>{p.name}</span>
              <span className="flex gap-1 text-lg">
                {p.badges.map((b, i) => (
                  <motion.span key={i} whileHover={{ scale: 1.3, rotate: 10 }} className="cursor-default">{b}</motion.span>
                ))}
              </span>
            </h1>
            <p className="mt-2 min-h-6 text-muted-foreground">
              {w.typingLines.length ? <Typewriter lines={w.typingLines} /> : p.bio}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {p.location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/70 px-3 py-1 text-xs">
                  <MapPin className="size-3.5 text-primary" /> {p.location}
                </span>
              )}
              {w.showClock && <LocalClock timezone={w.timezone} />}
            </div>

            <ProfileTabs
              data={data}
              guestbook={<Guestbook />}
              about={
                <>
                  {w.showPresence && <Presence status={data.status} avatar={p.avatar} discordId={w.discordId} />}
                  {w.quote && <QuoteCard quote={w.quote} author={w.quoteAuthor} />}
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
                </>
              }
            />
          </TiltCard>
        </section>
      )}

      {data && a && a.playerStyle !== "hidden" && (
        <MusicPlayer music={data.music} muted={muted} started={started} mini={a.playerStyle === "mini"} />
      )}
    </main>
  );
}
