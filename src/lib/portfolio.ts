import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Social = { id: string; platform: string; url: string; label?: string };
export type Track = { id: string; title: string; url: string; artist?: string; cover?: string };
export type ParticleKind = "snow" | "stars" | "dust" | "fireflies" | "rain" | "sakura" | "bubbles" | "none";
export type Appearance = {
  accent: string;
  accent2: string;
  font: "sora" | "space-mono" | "syne" | "cormorant" | "outfit";
  cardStyle: "glass" | "solid" | "outline" | "minimal";
  avatarFrame: "spin" | "pulse" | "static" | "none";
  avatarShape: "circle" | "rounded" | "square";
  nameEffect: "glow" | "gradient" | "plain";
  overlay: number; // 0-90
  blur: number; // 0-12
  particleDensity: number; // 0.25-3
  particleColor: string;
  cursorTrail: boolean;
  tilt: boolean;
  enterText: string;
  showEnter: boolean;
  cardWidth: "compact" | "normal" | "wide";
  playerStyle: "full" | "mini" | "hidden";
  showViews: boolean;
};
export type Widgets = {
  discordId: string;
  typingLines: string[];
  showClock: boolean;
  timezone: string;
  quote: string;
  quoteAuthor: string;
  showGuestbook: boolean;
  showSkills: boolean;
  showProjects: boolean;
  showPresence: boolean;
};
export type PortfolioData = {
  profile: {
    name: string;
    bio: string;
    location: string;
    avatar: string;
    background: string;
    backgroundType: "image" | "video";
    particles: ParticleKind;
    badges: string[];
  };
  status: { username: string; activity: string; badges: string[]; color: string; state: string };
  socials: Social[];
  music: { autoplay: boolean; volume: number; loop: boolean; shuffle?: boolean; tracks: Track[] };
  skills?: Skill[];
  projects?: Project[];
  appearance?: Partial<Appearance>;
  widgets?: Partial<Widgets>;
};
export type Skill = { id: string; name: string; category: string };
export type Project = { id: string; title: string; description: string; tags: string[]; url: string };

export const DEFAULT_APPEARANCE: Appearance = {
  accent: "#9ad7ff",
  accent2: "#c49bff",
  font: "sora",
  cardStyle: "glass",
  avatarFrame: "spin",
  avatarShape: "circle",
  nameEffect: "glow",
  overlay: 55,
  blur: 2,
  particleDensity: 1,
  particleColor: "#ffffff",
  cursorTrail: true,
  tilt: true,
  enterText: "CLICK TO ENTER",
  showEnter: true,
  cardWidth: "normal",
  playerStyle: "full",
  showViews: true,
};

export const DEFAULT_WIDGETS: Widgets = {
  discordId: "",
  typingLines: [],
  showClock: true,
  timezone: "Asia/Dhaka",
  quote: "",
  quoteAuthor: "",
  showGuestbook: true,
  showSkills: true,
  showProjects: true,
  showPresence: true,
};

export const THEME_PRESETS: { name: string; accent: string; accent2: string; particleColor: string }[] = [
  { name: "Frost", accent: "#9ad7ff", accent2: "#c49bff", particleColor: "#ffffff" },
  { name: "Sakura", accent: "#ff9ec7", accent2: "#ffd1e3", particleColor: "#ffc4dc" },
  { name: "Ember", accent: "#ff8a4c", accent2: "#ffd36e", particleColor: "#ffcf8a" },
  { name: "Matrix", accent: "#5cff9d", accent2: "#00c2a8", particleColor: "#8affc1" },
  { name: "Blood", accent: "#ff4d5e", accent2: "#8b0a1a", particleColor: "#ff9aa5" },
  { name: "Mono", accent: "#e8e8e8", accent2: "#8a8a8a", particleColor: "#ffffff" },
  { name: "Ocean", accent: "#3dd6f5", accent2: "#2563eb", particleColor: "#bdf3ff" },
  { name: "Gold", accent: "#f5c84c", accent2: "#b8860b", particleColor: "#fff0b3" },
];

export const FONTS: Record<Appearance["font"], { label: string; family: string }> = {
  sora: { label: "Sora", family: '"Sora", ui-sans-serif, system-ui, sans-serif' },
  "space-mono": { label: "Space Mono", family: '"Space Mono", ui-monospace, monospace' },
  syne: { label: "Syne", family: '"Syne", ui-sans-serif, sans-serif' },
  cormorant: { label: "Cormorant", family: '"Cormorant Garamond", ui-serif, serif' },
  outfit: { label: "Outfit", family: '"Outfit", ui-sans-serif, sans-serif' },
};

export const appearanceOf = (d: PortfolioData): Appearance => ({ ...DEFAULT_APPEARANCE, ...(d.appearance ?? {}) });
export const widgetsOf = (d: PortfolioData): Widgets => ({ ...DEFAULT_WIDGETS, ...(d.widgets ?? {}) });

export function usePortfolio() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [views, setViews] = useState<number>(0);

  useEffect(() => {
    let active = true;
    supabase
      .from("portfolio")
      .select("data, views")
      .eq("id", 1)
      .single()
      .then(({ data: row }) => {
        if (!active || !row) return;
        setData(row.data as unknown as PortfolioData);
        setViews(row.views);
      });
    const channel = supabase
      .channel(`portfolio-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "portfolio" }, (p) => {
        const row = p.new as { data: PortfolioData; views: number };
        setData(row.data);
        setViews(row.views);
      })
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { data, views, setViews };
}
