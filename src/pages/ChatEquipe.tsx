import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessagesSquare, Send, Paperclip, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Msg {
  id: string; sender_id: string; recipient_id: string | null;
  content: string | null; created_at: string; read_at: string | null;
  attachments?: { id: string; file_url: string; file_name: string; file_type: string }[];
}

export default function ChatEquipe() {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [other, setOther] = useState<any>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("*").neq("user_id", user!.id);
      setMembers(data || []);
      if (data && data.length > 0) setOther(data[0]);
    })();
  }, [user]);

  useEffect(() => {
    if (!other) return;
    const load = async () => {
      const { data } = await supabase
        .from("team_messages")
        .select("*, attachments:team_message_attachments(*)")
        .or(`and(sender_id.eq.${user!.id},recipient_id.eq.${other.user_id}),and(sender_id.eq.${other.user_id},recipient_id.eq.${user!.id})`)
        .order("created_at");
      setMsgs((data || []) as any);
      // mark as read
      await supabase.from("team_messages").update({ read_at: new Date().toISOString() })
        .eq("recipient_id", user!.id).eq("sender_id", other.user_id).is("read_at", null);
    };
    load();

    const ch = supabase.channel("team-chat-" + other.user_id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "team_messages" }, (p: any) => {
        const m = p.new;
        if ((m.sender_id === user!.id && m.recipient_id === other.user_id) ||
            (m.sender_id === other.user_id && m.recipient_id === user!.id)) {
          load();
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "team_messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [other, user]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if ((!input.trim() && !file) || !other) return;
    const { data: msg, error } = await supabase.from("team_messages").insert({
      sender_id: user!.id, recipient_id: other.user_id, content: input.trim() || null,
    }).select().single();
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });

    if (file && msg) {
      const path = `${user!.id}/team/${msg.id}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("chat-attachments").upload(path, file);
      if (!upErr) {
        const url = supabase.storage.from("chat-attachments").getPublicUrl(path).data.publicUrl;
        await supabase.from("team_message_attachments").insert({
          message_id: msg.id, file_url: url, file_name: file.name, file_type: file.type, file_size: file.size,
        });
      }
    }
    setInput(""); setFile(null);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-3">
        <MessagesSquare className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold">Chat da Equipe</h1>
          <p className="text-muted-foreground text-sm">Comunicação em tempo real</p>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <Card className="w-64 bg-gradient-card p-2 space-y-1 overflow-y-auto scrollbar-thin">
          {members.map(m => (
            <button key={m.user_id} onClick={() => setOther(m)}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 ${other?.user_id === m.user_id ? "bg-primary/15 border border-primary/30" : "hover:bg-secondary"}`}>
              <div className="h-9 w-9 rounded-full bg-primary/20 grid place-items-center text-primary text-sm font-bold">{m.nome?.[0]}</div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{m.nome}</div>
                <div className="text-xs text-muted-foreground truncate">{m.cargo}</div>
              </div>
            </button>
          ))}
        </Card>

        <Card className="flex-1 flex flex-col bg-gradient-card overflow-hidden">
          {other ? (
            <>
              <div className="p-4 border-b border-border">
                <div className="font-medium">{other.nome}</div>
                <div className="text-xs text-muted-foreground">{other.email}</div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {msgs.map(m => {
                  const mine = m.sender_id === user!.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                        {m.content && <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>}
                        {m.attachments?.map(a => (
                          a.file_type?.startsWith("image/")
                            ? <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer"><img src={a.file_url} className="rounded mt-1 max-h-48" /></a>
                            : <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs mt-1 underline"><Paperclip className="h-3 w-3" />{a.file_name}</a>
                        ))}
                        <div className={`text-[10px] mt-1 flex items-center gap-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {format(new Date(m.created_at), "HH:mm")}
                          {mine && (m.read_at ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border p-3 space-y-2">
                {file && <div className="text-xs text-muted-foreground flex items-center gap-2">📎 {file.name} <button onClick={() => setFile(null)} className="text-destructive">×</button></div>}
                <div className="flex gap-2">
                  <label className="cursor-pointer p-2 rounded hover:bg-secondary">
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                    <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                  </label>
                  <Input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Mensagem..." />
                  <Button onClick={send} className="bg-gradient-primary text-primary-foreground"><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-muted-foreground text-sm">Selecione um colega</div>
          )}
        </Card>
      </div>
    </div>
  );
}
