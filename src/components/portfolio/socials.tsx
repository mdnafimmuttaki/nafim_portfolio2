import type { IconType } from "react-icons";
import {
  SiInstagram, SiDiscord, SiFacebook, SiGithub, SiRoblox, SiSpotify, SiTwitch, SiPinterest,
  SiYoutube, SiX, SiTiktok, SiSteam, SiTelegram, SiReddit,
} from "react-icons/si";
import { MdEmail, MdLink } from "react-icons/md";

export const PLATFORMS: Record<string, { icon: IconType; color: string; label: string }> = {
  instagram: { icon: SiInstagram, color: "#E4405F", label: "Instagram" },
  discord: { icon: SiDiscord, color: "#5865F2", label: "Discord" },
  facebook: { icon: SiFacebook, color: "#1877F2", label: "Facebook" },
  email: { icon: MdEmail, color: "#EA4335", label: "Email" },
  github: { icon: SiGithub, color: "#f0f6fc", label: "GitHub" },
  roblox: { icon: SiRoblox, color: "#e2e2e2", label: "Roblox" },
  spotify: { icon: SiSpotify, color: "#1DB954", label: "Spotify" },
  twitch: { icon: SiTwitch, color: "#9146FF", label: "Twitch" },
  pinterest: { icon: SiPinterest, color: "#E60023", label: "Pinterest" },
  youtube: { icon: SiYoutube, color: "#FF0000", label: "YouTube" },
  x: { icon: SiX, color: "#ffffff", label: "X" },
  tiktok: { icon: SiTiktok, color: "#25F4EE", label: "TikTok" },
  steam: { icon: SiSteam, color: "#66c0f4", label: "Steam" },
  telegram: { icon: SiTelegram, color: "#26A5E4", label: "Telegram" },
  reddit: { icon: SiReddit, color: "#FF4500", label: "Reddit" },
  link: { icon: MdLink, color: "#a5b4fc", label: "Website" },
};

export const getPlatform = (p: string) => PLATFORMS[p] ?? PLATFORMS['link']!;
