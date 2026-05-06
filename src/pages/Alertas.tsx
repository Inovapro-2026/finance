import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Alertas() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(100);
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await supabase.from("alerts").update({ read: true }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold">Alertas</h1>
          <p className="text-muted-foreground text-sm">Avisos automáticos da plataforma</p>
        </div>
      </div>

      <Card className="bg-gradient-card divide-y divide-border">
        {items.length === 0 && <p className="p-6 text-sm text-muted-foreground">Sem alertas no momento.</p>}
        {items.map(a => (
          <div key={a.id} className={`p-4 flex items-start gap-3 ${!a.read ? "bg-primary/5" : ""}`}>
            <div className={`h-2 w-2 rounded-full mt-2 ${a.severity === "danger" ? "bg-destructive" : a.severity === "warning" ? "bg-warning" : "bg-info"}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{a.title}</span>
                <Badge variant="outline" className="text-[10px]">{a.severity}</Badge>
              </div>
              {a.message && <p className="text-xs text-muted-foreground mt-1">{a.message}</p>}
              <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })}</p>
            </div>
            {!a.read && <Button size="sm" variant="ghost" onClick={() => markRead(a.id)}><Check className="h-4 w-4" /></Button>}
          </div>
        ))}
      </Card>
    </div>
  );
}
