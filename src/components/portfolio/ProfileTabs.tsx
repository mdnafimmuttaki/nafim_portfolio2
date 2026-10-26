import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { PortfolioData } from "@/lib/portfolio";

type Tab = "about" | "skills" | "projects";

export function ProfileTabs({ data, about }: { data: PortfolioData; about: ReactNode }) {
  const [tab, setTab] = useState<Tab>("about");
  const skills = (data.skills ?? []).filter((s) => s.name);
  const projects = (data.projects ?? []).filter((p) => p.title);
  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "about", label: "About", show: true },
    { id: "skills", label: "Skills", show: skills.length > 0 },
    { id: "projects", label: "Projects", show: projects.length > 0 },
  ];
  const visible = tabs.filter((t) => t.show);
  const groups = skills.reduce<Record<string, string[]>>((acc, s) => {
    (acc[s.category || "General"] ??= []).push(s.name);
    return acc;
  }, {});

  return (
    <div className="mt-6">
      {visible.length > 1 && (
        <div className="relative mx-auto mb-4 flex w-fit gap-1 rounded-full bg-secondary/60 p-1">
          {visible.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="relative rounded-full px-4 py-1.5 text-xs font-semibold transition-colors">
              {tab === t.id && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
              <span className={`relative ${tab === t.id ? "text-primary-foreground" : "text-muted-foreground"}`}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          {tab === "about" && about}
          {tab === "skills" && (
            <div className="space-y-3 text-left">
              {Object.entries(groups).map(([cat, names]) => (
                <div key={cat}>
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{cat}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {names.map((n, i) => (
                      <motion.span key={n + i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} whileHover={{ y: -2 }}
                        className="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{n}</motion.span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "projects" && (
            <div className="grid gap-2 text-left">
              {projects.map((p, i) => (
                <motion.a key={p.id} href={p.url || undefined} target="_blank" rel="noreferrer" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.02 }}
                  className="group block rounded-2xl bg-secondary/50 p-3 transition-colors hover:bg-secondary/80">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{p.title}</span>
                    {p.url && <ExternalLink className="size-3.5 text-muted-foreground transition group-hover:text-primary" />}
                  </div>
                  {p.description && <p className="mt-0.5 text-sm text-muted-foreground">{p.description}</p>}
                  {p.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.tags.map((t) => <span key={t} className="rounded-md bg-background/50 px-1.5 py-0.5 font-mono text-[10px]">{t}</span>)}
                    </div>
                  )}
                </motion.a>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
