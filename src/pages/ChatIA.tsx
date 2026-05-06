import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Send, Image as ImageIcon, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { logActivity } from "@/lib/activity";
import { toast } from "@/hooks/use-toast";

interface Msg { role: "user" | "assistant"; content: string; image_url?: string | null }

export default function ChatIA() {
  const { user } = useAuth();
  const [chatId, setChatId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: existing } = await supabase.from("ai_chats").select("*").eq("user_id", user!.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      let id = existing?.id;
      if (!id) {
        const { data } = await supabase.from("ai_chats").insert({ user_id: user!.id }).select().single();
        id = data!.id;
      }
      setChatId(id!);
      const { data: m } = await supabase.from("ai_chat_messages").select("*").eq("chat_id", id!).order("created_at");
      setMsgs((m || []) as any);
    })();
  }, [user]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" }); }, [msgs]);

  const onPickImg = (f: File | null) => {
    setImgFile(f);
    if (f) {
      const r = new FileReader();
      r.onload = e => setImgPreview(e.target?.result as string);
      r.readAsDataURL(f);
    } else setImgPreview(null);
  };

  const send = async () => {
    if (!input.trim() && !imgFile) return;
    if (!chatId) return;
    setLoading(true);
    const content = input.trim();
    let imageUrl: string | null = null;

    try {
      if (imgFile) {
        const path = `${user!.id}/ai/${Date.now()}-${imgFile.name}`;
        const { error: upErr } = await supabase.storage.from("chat-attachments").upload(path, imgFile);
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from("chat-attachments").getPublicUrl(path).data.publicUrl;
      }

      const userMsg: Msg = { role: "user", content, image_url: imageUrl };
      const next = [...msgs, userMsg];
      setMsgs(next);
      await supabase.from("ai_chat_messages").insert({ chat_id: chatId, role: "user", content, image_url: imageUrl });
      setInput(""); onPickImg(null);

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { messages: next.map(m => ({ role: m.role, content: m.content })), imageUrl },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);

      const assistant: Msg = { role: "assistant", content: data.content };
      setMsgs([...next, assistant]);
      await supabase.from("ai_chat_messages").insert({ chat_id: chatId, role: "assistant", content: data.content });
      await logActivity({ type: "ai_chat", action: "conversou com a IA sobre", target: content.slice(0, 60) });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-3">
        <Sparkles className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold">Chat com IA</h1>
          <p className="text-muted-foreground text-sm">Especialista em otimização de anúncios do Mercado Livre</p>
        </div>
      </div>

      <Card className="flex-1 bg-gradient-card flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {msgs.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">
              <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary/50" />
              <p>Comece pedindo: "Melhore esse título", envie um print do anúncio, ou cole sua descrição.</p>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl p-4 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                {m.image_url && <img src={m.image_url} className="rounded mb-2 max-h-64" />}
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Pensando...</div>}
        </div>

        <div className="border-t border-border p-3 space-y-2">
          {imgPreview && (
            <div className="relative inline-block">
              <img src={imgPreview} className="h-20 rounded" />
              <button onClick={() => onPickImg(null)} className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5"><X className="h-3 w-3" /></button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <label className="cursor-pointer p-2 rounded hover:bg-secondary">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <input type="file" accept="image/*" className="hidden" onChange={e => onPickImg(e.target.files?.[0] || null)} />
            </label>
            <Textarea
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Pergunte algo, ou cole um anúncio..." className="min-h-[44px] max-h-32 resize-none" rows={1}
            />
            <Button onClick={send} disabled={loading} className="bg-gradient-primary text-primary-foreground"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
