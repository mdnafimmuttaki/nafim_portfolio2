import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, LogOut, Plus, Trash2, Upload } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { FONTS, THEME_PRESETS, appearanceOf, widgetsOf, type Appearance, type ParticleKind, type PortfolioData, type Widgets } from "@/lib/portfolio";
import { PLATFORMS } from "@/components/portfolio/socials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — nafim bio" },
      { name: "description", content: "Manage the nafim bio page content." },
      { property: "og:title", content: "Admin — nafim bio" },
      { property: "og:description", content: "Manage the nafim bio page content." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const uid = () => Math.random().toString(36).slice(2, 10);

function AdminPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      {session === undefined ? null : !session ? (
        <Login />
      ) : isAdmin === false ? (
        <Shell>
          <p className="text-muted-foreground">This account doesn't have admin access.</p>
          <Button variant="secondary" className="mt-4" onClick={() => supabase.auth.signOut()}>Sign out</Button>
        </Shell>
      ) : isAdmin ? (
        <Editor />
      ) : null}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="glass mx-auto max-w-sm rounded-3xl p-8">{children}</div>;
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error, data } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (mode === "up" && !data.session) toast.success("Check your email to confirm your account.");
  };
  return (
    <Shell>
      <h1 className="text-2xl font-bold">Admin portal</h1>
      <p className="mt-1 text-sm text-muted-foreground">{mode === "in" ? "Sign in to edit your bio page." : "The first account created becomes the admin."}</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</Button>
      </form>
      <button className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "No account yet? Create one" : "Have an account? Sign in"}
      </button>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}

function Editor() {
  const [d, setD] = useState<PortfolioData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("portfolio").select("data").eq("id", 1).single().then(({ data }) => data && setD(data.data as unknown as PortfolioData));
  }, []);

  if (!d) return null;
  const set = <K extends keyof PortfolioData>(k: K, v: Partial<PortfolioData[K]>) =>
    setD({ ...d, [k]: Array.isArray(v) ? v : { ...(d[k] as object), ...v } });
  const a = appearanceOf(d);
  const w = widgetsOf(d);
  const setA = (v: Partial<Appearance>) => setD({ ...d, appearance: { ...a, ...v } });
  const setW = (v: Partial<Widgets>) => setD({ ...d, widgets: { ...w, ...v } });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("portfolio").update({ data: d as never, updated_at: new Date().toISOString() }).eq("id", 1);
    setSaving(false);
    error ? toast.error(error.message) : toast.success("Saved — live on your page now.");
  };

  const upload = async (file: File) => {
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast.error(error.message); return null; }
    const { data } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    return data?.signedUrl ?? null;
  };

  const moveSocial = (i: number, dir: -1 | 1) => {
    const arr = [...d.socials];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    setD({ ...d, socials: arr });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Changes go live the moment you save.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" asChild><Link to="/"><ExternalLink /> View page</Link></Button>
          <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => supabase.auth.signOut()}><LogOut /></Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </header>

      <Tabs defaultValue="profile">
        <TabsList className="w-full flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="socials">Socials</TabsTrigger>
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="look">Appearance</TabsTrigger>
          <TabsTrigger value="motion">Effects</TabsTrigger>
          <TabsTrigger value="widgets">Widgets</TabsTrigger>
          <TabsTrigger value="guestbook">Guestbook</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="glass mt-4 grid gap-4 rounded-2xl p-5 sm:grid-cols-2">
          <Field label="Display name"><Input value={d.profile.name} onChange={(e) => set("profile", { name: e.target.value })} /></Field>
          <Field label="Location"><Input value={d.profile.location} onChange={(e) => set("profile", { location: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Bio"><Input value={d.profile.bio} onChange={(e) => set("profile", { bio: e.target.value })} /></Field></div>
          <div className="sm:col-span-2"><Field label="Avatar image URL"><Input value={d.profile.avatar} onChange={(e) => set("profile", { avatar: e.target.value })} /></Field></div>
          <div className="sm:col-span-2"><Field label="Background URL (empty = default wallpaper)"><Input value={d.profile.background} onChange={(e) => set("profile", { background: e.target.value })} /></Field></div>
          <Field label="Background type">
            <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={d.profile.backgroundType} onChange={(e) => set("profile", { backgroundType: e.target.value as "image" | "video" })}>
              <option value="image">Image</option><option value="video">Video (looping)</option>
            </select>
          </Field>
          <Field label="Particle effect">
            <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={d.profile.particles} onChange={(e) => set("profile", { particles: e.target.value as PortfolioData["profile"]["particles"] })}>
              <option value="snow">Snow</option><option value="stars">Stars</option><option value="dust">Dust</option><option value="none">None</option>
            </select>
          </Field>
          <div className="sm:col-span-2"><Field label="Name badges (emoji, comma separated)"><Input value={d.profile.badges.join(", ")} onChange={(e) => set("profile", { badges: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field></div>
        </TabsContent>

        <TabsContent value="status" className="glass mt-4 grid gap-4 rounded-2xl p-5 sm:grid-cols-2">
          <Field label="Username"><Input value={d.status.username} onChange={(e) => set("status", { username: e.target.value })} /></Field>
          <Field label="Indicator color">
            <div className="flex gap-2">
              <input type="color" className="h-9 w-12 rounded-md bg-transparent" value={d.status.color} onChange={(e) => set("status", { color: e.target.value })} />
              {([["Online", "#22c55e"], ["Idle", "#eab308"], ["DND", "#ef4444"], ["Offline", "#6b7280"]] as const).map(([n, c]) => (
                <Button key={n} type="button" size="sm" variant="secondary" onClick={() => set("status", { color: c, state: n.toLowerCase() })}>{n}</Button>
              ))}
            </div>
          </Field>
          <div className="sm:col-span-2"><Field label="Activity text"><Input value={d.status.activity} onChange={(e) => set("status", { activity: e.target.value })} /></Field></div>
          <div className="sm:col-span-2"><Field label="Role badges (comma separated)"><Input value={d.status.badges.join(", ")} onChange={(e) => set("status", { badges: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field></div>
        </TabsContent>

        <TabsContent value="socials" className="glass mt-4 space-y-3 rounded-2xl p-5">
          {d.socials.map((s, i) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-secondary/50 p-2">
              <select className="h-9 rounded-md border border-input bg-transparent px-2 text-sm" value={s.platform} onChange={(e) => setD({ ...d, socials: d.socials.map((x) => x.id === s.id ? { ...x, platform: e.target.value } : x) })}>
                {Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <Input className="min-w-40 flex-1" value={s.url} placeholder="https://" onChange={(e) => setD({ ...d, socials: d.socials.map((x) => x.id === s.id ? { ...x, url: e.target.value } : x) })} />
              <Button size="icon" variant="ghost" aria-label="Move up" onClick={() => moveSocial(i, -1)}><ArrowUp /></Button>
              <Button size="icon" variant="ghost" aria-label="Move down" onClick={() => moveSocial(i, 1)}><ArrowDown /></Button>
              <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => setD({ ...d, socials: d.socials.filter((x) => x.id !== s.id) })}><Trash2 /></Button>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setD({ ...d, socials: [...d.socials, { id: uid(), platform: "link", url: "" }] })}><Plus /> Add link</Button>
        </TabsContent>

        <TabsContent value="music" className="glass mt-4 space-y-4 rounded-2xl p-5">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm"><Switch checked={d.music.loop} onCheckedChange={(v) => set("music", { loop: v })} /> Loop playlist</label>
            <label className="flex items-center gap-2 text-sm">Volume
              <input type="range" min={0} max={1} step={0.05} value={d.music.volume} onChange={(e) => set("music", { volume: Number(e.target.value) })} />
            </label>
          </div>
          {d.music.tracks.map((t) => (
            <div key={t.id} className="grid gap-2 rounded-xl bg-secondary/50 p-3 sm:grid-cols-[1fr_2fr_auto_auto]">
              <Input value={t.title} placeholder="Track title" onChange={(e) => set("music", { tracks: d.music.tracks.map((x) => x.id === t.id ? { ...x, title: e.target.value } : x) })} />
              <Input value={t.url} placeholder="Audio URL" onChange={(e) => set("music", { tracks: d.music.tracks.map((x) => x.id === t.id ? { ...x, url: e.target.value } : x) })} />
              <Button variant="secondary" asChild>
                <label className="cursor-pointer"><Upload /> Upload
                  <input type="file" accept="audio/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    toast.loading("Uploading…", { id: "up" });
                    const url = await upload(f);
                    toast.dismiss("up");
                    if (url) { set("music", { tracks: d.music.tracks.map((x) => x.id === t.id ? { ...x, url, title: x.title || f.name.replace(/\.[^.]+$/, "") } : x) }); toast.success("Uploaded — remember to save."); }
                  }} />
                </label>
              </Button>
              <Button size="icon" variant="ghost" aria-label="Remove track" onClick={() => set("music", { tracks: d.music.tracks.filter((x) => x.id !== t.id) })}><Trash2 /></Button>
            </div>
          ))}
          <Button variant="secondary" onClick={() => set("music", { tracks: [...d.music.tracks, { id: uid(), title: "", url: "" }] })}><Plus /> Add track</Button>
        </TabsContent>

        <TabsContent value="skills" className="glass mt-4 space-y-3 rounded-2xl p-5">
          {(d.skills ?? []).map((s) => (
            <div key={s.id} className="grid gap-2 rounded-xl bg-secondary/50 p-2 sm:grid-cols-[2fr_1fr_auto]">
              <Input value={s.name} placeholder="Skill (e.g. React)" onChange={(e) => setD({ ...d, skills: (d.skills ?? []).map((x) => x.id === s.id ? { ...x, name: e.target.value } : x) })} />
              <Input value={s.category} placeholder="Group (e.g. Frontend)" onChange={(e) => setD({ ...d, skills: (d.skills ?? []).map((x) => x.id === s.id ? { ...x, category: e.target.value } : x) })} />
              <Button size="icon" variant="ghost" aria-label="Remove skill" onClick={() => setD({ ...d, skills: (d.skills ?? []).filter((x) => x.id !== s.id) })}><Trash2 /></Button>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setD({ ...d, skills: [...(d.skills ?? []), { id: uid(), name: "", category: "General" }] })}><Plus /> Add skill</Button>
        </TabsContent>

        <TabsContent value="projects" className="glass mt-4 space-y-3 rounded-2xl p-5">
          {(d.projects ?? []).map((p) => {
            const up = (v: Partial<typeof p>) => setD({ ...d, projects: (d.projects ?? []).map((x) => x.id === p.id ? { ...x, ...v } : x) });
            return (
              <div key={p.id} className="grid gap-2 rounded-xl bg-secondary/50 p-3 sm:grid-cols-2">
                <Input value={p.title} placeholder="Project name" onChange={(e) => up({ title: e.target.value })} />
                <Input value={p.url} placeholder="https:// link" onChange={(e) => up({ url: e.target.value })} />
                <Input className="sm:col-span-2" value={p.description} placeholder="Short description" onChange={(e) => up({ description: e.target.value })} />
                <Input value={p.tags.join(", ")} placeholder="Tags (comma separated)" onChange={(e) => up({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
                <Button variant="ghost" onClick={() => setD({ ...d, projects: (d.projects ?? []).filter((x) => x.id !== p.id) })}><Trash2 /> Remove</Button>
              </div>
            );
          })}
          <Button variant="secondary" onClick={() => setD({ ...d, projects: [...(d.projects ?? []), { id: uid(), title: "", description: "", tags: [], url: "" }] })}><Plus /> Add project</Button>
        </TabsContent>

        <TabsContent value="look" className="glass mt-4 space-y-5 rounded-2xl p-5">
          <Field label="Theme presets">
            <div className="flex flex-wrap gap-2">
              {THEME_PRESETS.map((t) => (
                <Button key={t.name} size="sm" variant="secondary" onClick={() => setA({ accent: t.accent, accent2: t.accent2, particleColor: t.particleColor })}>
                  <span className="size-3 rounded-full" style={{ background: t.accent }} />{t.name}
                </Button>
              ))}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Accent color"><input type="color" className="h-9 w-full rounded-md bg-transparent" value={a.accent} onChange={(e) => setA({ accent: e.target.value })} /></Field>
            <Field label="Second accent"><input type="color" className="h-9 w-full rounded-md bg-transparent" value={a.accent2} onChange={(e) => setA({ accent2: e.target.value })} /></Field>
            <Field label="Particle color"><input type="color" className="h-9 w-full rounded-md bg-transparent" value={a.particleColor} onChange={(e) => setA({ particleColor: e.target.value })} /></Field>
            <Sel label="Font" value={a.font} onChange={(v) => setA({ font: v as Appearance["font"] })} opts={Object.entries(FONTS).map(([k, f]) => [k, f.label])} />
            <Sel label="Card style" value={a.cardStyle} onChange={(v) => setA({ cardStyle: v as Appearance["cardStyle"] })} opts={[["glass", "Glass"], ["solid", "Solid"], ["outline", "Outline"], ["minimal", "Minimal"]]} />
            <Sel label="Card width" value={a.cardWidth} onChange={(v) => setA({ cardWidth: v as Appearance["cardWidth"] })} opts={[["compact", "Compact"], ["normal", "Normal"], ["wide", "Wide"]]} />
            <Sel label="Avatar shape" value={a.avatarShape} onChange={(v) => setA({ avatarShape: v as Appearance["avatarShape"] })} opts={[["circle", "Circle"], ["rounded", "Rounded"], ["square", "Square"]]} />
            <Sel label="Avatar frame" value={a.avatarFrame} onChange={(v) => setA({ avatarFrame: v as Appearance["avatarFrame"] })} opts={[["spin", "Spinning ring"], ["pulse", "Pulse"], ["static", "Solid"], ["none", "None"]]} />
            <Sel label="Name effect" value={a.nameEffect} onChange={(v) => setA({ nameEffect: v as Appearance["nameEffect"] })} opts={[["glow", "Glow"], ["gradient", "Gradient"], ["plain", "Plain"]]} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Range label={`Background darkness (${a.overlay}%)`} min={0} max={90} step={1} value={a.overlay} onChange={(v) => setA({ overlay: v })} />
            <Range label={`Background blur (${a.blur}px)`} min={0} max={12} step={1} value={a.blur} onChange={(v) => setA({ blur: v })} />
          </div>
        </TabsContent>

        <TabsContent value="motion" className="glass mt-4 space-y-5 rounded-2xl p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Sel label="Particle effect" value={d.profile.particles} onChange={(v) => set("profile", { particles: v as ParticleKind })} opts={[["snow", "Snow"], ["stars", "Stars"], ["dust", "Dust"], ["fireflies", "Fireflies"], ["rain", "Rain"], ["sakura", "Sakura petals"], ["bubbles", "Bubbles"], ["none", "None"]]} />
            <Range label={`Particle amount (${a.particleDensity}x)`} min={0.25} max={3} step={0.25} value={a.particleDensity} onChange={(v) => setA({ particleDensity: v })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle label="Glowing cursor trail" checked={a.cursorTrail} onChange={(v) => setA({ cursorTrail: v })} />
            <Toggle label="3D card tilt" checked={a.tilt} onChange={(v) => setA({ tilt: v })} />
            <Toggle label="Show 'click to enter' screen" checked={a.showEnter} onChange={(v) => setA({ showEnter: v })} />
            <Toggle label="Show view counter" checked={a.showViews} onChange={(v) => setA({ showViews: v })} />
          </div>
          <Field label="Enter screen text"><Input value={a.enterText} onChange={(e) => setA({ enterText: e.target.value })} /></Field>
          <Sel label="Music player" value={a.playerStyle} onChange={(v) => setA({ playerStyle: v as Appearance["playerStyle"] })} opts={[["full", "Full"], ["mini", "Mini"], ["hidden", "Hidden"]]} />
          <Toggle label="Shuffle playlist" checked={!!d.music.shuffle} onChange={(v) => set("music", { shuffle: v })} />
        </TabsContent>

        <TabsContent value="widgets" className="glass mt-4 space-y-5 rounded-2xl p-5">
          <Field label="Typing bio lines (one per line — replaces the bio with a typewriter)">
            <textarea className="min-h-24 w-full rounded-md border border-input bg-transparent p-2 text-sm" value={w.typingLines.join("\n")} onChange={(e) => setW({ typingLines: e.target.value.split("\n") })} onBlur={(e) => setW({ typingLines: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Discord user ID (live status)"><Input value={w.discordId} placeholder="e.g. 123456789012345678" onChange={(e) => setW({ discordId: e.target.value.trim() })} /></Field>
            <Field label="Time zone for clock"><Input value={w.timezone} placeholder="Asia/Dhaka" onChange={(e) => setW({ timezone: e.target.value })} /></Field>
            <Field label="Quote"><Input value={w.quote} onChange={(e) => setW({ quote: e.target.value })} /></Field>
            <Field label="Quote author"><Input value={w.quoteAuthor} onChange={(e) => setW({ quoteAuthor: e.target.value })} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle label="Show status card" checked={w.showPresence} onChange={(v) => setW({ showPresence: v })} />
            <Toggle label="Show local clock" checked={w.showClock} onChange={(v) => setW({ showClock: v })} />
            <Toggle label="Show skills tab" checked={w.showSkills} onChange={(v) => setW({ showSkills: v })} />
            <Toggle label="Show projects tab" checked={w.showProjects} onChange={(v) => setW({ showProjects: v })} />
            <Toggle label="Show guestbook tab" checked={w.showGuestbook} onChange={(v) => setW({ showGuestbook: v })} />
          </div>
        </TabsContent>

        <TabsContent value="guestbook" className="glass mt-4 rounded-2xl p-5">
          <GuestbookAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Sel({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: (readonly [string, string])[] }) {
  return (
    <Field label={label}>
      <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </Field>
  );
}

function Range({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number }) {
  return <Field label={label}><input type="range" className="w-full accent-primary" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /></Field>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-xl bg-secondary/50 p-3 text-sm"><Switch checked={checked} onCheckedChange={onChange} /> {label}</label>;
}

type Entry = { id: string; name: string; message: string; created_at: string };
function GuestbookAdmin() {
  const [rows, setRows] = useState<Entry[]>([]);
  useEffect(() => {
    supabase.from("guestbook").select("*").order("created_at", { ascending: false }).limit(200).then(({ data }) => setRows(data ?? []));
  }, []);
  const del = async (id: string) => {
    const { error } = await supabase.from("guestbook").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Message removed.");
  };
  if (!rows.length) return <p className="text-sm text-muted-foreground">No guestbook messages yet.</p>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="flex items-start gap-2 rounded-xl bg-secondary/50 p-3">
          <div className="flex-1 text-sm"><span className="font-semibold">{r.name}</span> <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span><p className="text-muted-foreground">{r.message}</p></div>
          <Button size="icon" variant="ghost" aria-label="Delete message" onClick={() => del(r.id)}><Trash2 /></Button>
        </div>
      ))}
    </div>
  );
}
