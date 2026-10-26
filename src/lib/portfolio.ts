import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Social = { id: string; platform: string; url: string; label?: string };
export type Track = { id: string; title: string; url: string };
export type PortfolioData = {
  profile: {
    name: string;
    bio: string;
    location: string;
    avatar: string;
    background: string;
    backgroundType: "image" | "video";
    particles: "snow" | "stars" | "dust" | "none";
    badges: string[];
  };
  status: { username: string; activity: string; badges: string[]; color: string; state: string };
  socials: Social[];
  music: { autoplay: boolean; volume: number; loop: boolean; tracks: Track[] };
  skills?: Skill[];
  projects?: Project[];
};
export type Skill = { id: string; name: string; category: string };
export type Project = { id: string; title: string; description: string; tags: string[]; url: string };

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
