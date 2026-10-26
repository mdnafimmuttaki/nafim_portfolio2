import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Entry = { id: string; name: string; message: string; created_at: string };

export function Guestbook() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = () =>
      supabase.from("guestbook").select("*").order("created_at", { ascending: false }).limit(30).then(({ data }) => data && setEntries(data));
    load();
    const ch = supabase
      .channel(`gb-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "guestbook" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localStorage.getItem("gb-last") && Date.now() - Number(localStorage.getItem("gb-last")) < 60000) {
      toast.error("Slow down — one message a minute.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("guestbook").insert({ name: name.trim().slice(0, 40), message: msg.trim().slice(0, 280) });
    setBusy(false);
    if (error) { toast.error("Couldn't sign the guestbook."); return; }
    localStorage.setItem("gb-last", String(Date.now()));
    setMsg("");
    toast.success("Thanks for signing!");
  };

  return (
    <div className="text-left">
      <form onSubmit={submit} className="space-y-2">
        <input required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
          className="h-9 w-full rounded-lg border border-input bg-secondary/40 px-3 text-sm outline-none focus:border-primary" />
        <div className="flex gap-2">
          <input required maxLength={280} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Leave a message…"
            className="h-9 flex-1 rounded-lg border border-input bg-secondary/40 px-3 text-sm outline-none focus:border-primary" />
          <button disabled={busy} aria-label="Send" className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
            <Send className="size-4" />
          </button>
        </div>
      </form>
      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
        {entries.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Be the first to sign.</p>}
        {entries.map((en) => (
          <div key={en.id} className="rounded-xl bg-secondary/40 p-2.5">
            <div className="flex justify-between gap-2 text-xs">
              <span className="font-semibold text-primary">{en.name}</span>
              <span className="text-muted-foreground">{formatDistanceToNow(new Date(en.created_at), { addSuffix: true })}</span>
            </div>
            <p className="mt-0.5 break-words text-sm">{en.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
