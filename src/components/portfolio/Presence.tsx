import { useEffect, useState } from "react";
import type { PortfolioData } from "@/lib/portfolio";

type Lanyard = {
  discord_status: "online" | "idle" | "dnd" | "offline";
  discord_user: { username: string; global_name?: string; avatar?: string; id: string };
  activities: { name: string; type: number; state?: string; details?: string }[];
  listening_to_spotify: boolean;
  spotify?: { song: string; artist: string; album_art_url: string };
};

const STATUS_COLOR = { online: "#22c55e", idle: "#eab308", dnd: "#ef4444", offline: "#6b7280" } as const;

/** Live Discord presence via the public Lanyard API, falling back to the manual status. */
export function Presence({ status, avatar, discordId }: { status: PortfolioData["status"]; avatar: string; discordId: string }) {
  const [live, setLive] = useState<Lanyard | null>(null);

  useEffect(() => {
    if (!discordId) { setLive(null); return; }
    let alive = true;
    const load = () =>
      fetch(`https://api.lanyard.rest/v1/users/${discordId}`)
        .then((r) => r.json())
        .then((j) => alive && j.success && setLive(j.data))
        .catch(() => {});
    load();
    const t = setInterval(load, 20000);
    return () => { alive = false; clearInterval(t); };
  }, [discordId]);

  const name = live ? live.discord_user.global_name || live.discord_user.username : status.username;
  const img = live?.discord_user.avatar
    ? `https://cdn.discordapp.com/avatars/${live.discord_user.id}/${live.discord_user.avatar}.png?size=128`
    : avatar;
  const color = live ? STATUS_COLOR[live.discord_status] : status.color;
  const act = live?.activities.find((a) => a.type !== 4 && a.type !== 2);
  const custom = live?.activities.find((a) => a.type === 4)?.state;
  const activity = live
    ? act ? `Playing ${act.name}${act.details ? ` — ${act.details}` : ""}` : custom || (live.discord_status === "offline" ? "offline" : "currently doing nothing")
    : status.activity;

  return (
    <div className="mt-6 space-y-2">
      <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3 text-left">
        <div className="relative shrink-0">
          <img src={img} alt="" className="size-12 rounded-full bg-muted object-cover" />
          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-secondary" style={{ background: color }} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold">{name}</span>
            {status.badges.map((b) => (
              <span key={b} className="rounded-md bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">{b}</span>
            ))}
          </div>
          <p className="truncate text-sm text-muted-foreground">{activity}</p>
        </div>
      </div>
      {live?.listening_to_spotify && live.spotify && (
        <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-2.5 text-left">
          <img src={live.spotify.album_art_url} alt="" className="size-10 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-online">Listening on Spotify</p>
            <p className="truncate text-sm font-semibold">{live.spotify.song}</p>
            <p className="truncate text-xs text-muted-foreground">{live.spotify.artist}</p>
          </div>
        </div>
      )}
    </div>
  );
}
