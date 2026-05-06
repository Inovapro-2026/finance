import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Trash2, RefreshCw } from "lucide-react";
import { fmtBRL } from "@/lib/pricing";
import { format } from "date-fns";
import { logActivity } from "@/lib/activity";
import { toast } from "@/hooks/use-toast";

export default function Produtos() {
  const [items, setItems] = useState<any[]>([]);
  const [profs, setProfs] = useState<Map<string, string>>(new Map());

  const load = async () => {
    const { data } = await supabase.from("products").select("*").order("updated_at", { ascending: false });
    setItems(data || []);
    const ids = [...new Set((data || []).map((p: any) => p.last_analyzed_by).filter(Boolean))];
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("user_id, nome").in("user_id", ids as string[]);
      setProfs(new Map((ps || []).map((p: any) => [p.user_id, p.nome])));
    }
  };
  useEffect(() => { load(); }, []);

  const importMine = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("ml-api", { body: { action: "my-items" } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      const { data: { user } } = await supabase.auth.getUser();
      const rows = (data.items || []).map((it: any) => ({
        user_id: user!.id, ml_item_id: it.id, title: it.title,
        image_url: it.thumbnail || it.pictures?.[0]?.url, current_price: it.price, status: it.status,
      }));
      if (rows.length) await supabase.from("products").upsert(rows, { onConflict: "ml_item_id" });
      await logActivity({ type: "product_created", action: `importou ${rows.length} produtos do Mercado Livre`, target: "" });
      toast({ title: `${rows.length} produtos importados` });
      load();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (id: string, title: string) => {
    await supabase.from("products").delete().eq("id", id);
    await logActivity({ type: "product_deleted", action: "excluiu produto", target: title });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-bold">Meus Produtos</h1>
            <p className="text-muted-foreground text-sm">{items.length} produtos cadastrados</p>
          </div>
        </div>
        <Button onClick={importMine} variant="outline"><RefreshCw className="h-4 w-4" />Importar do ML</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 && <p className="text-sm text-muted-foreground col-span-full">Nenhum produto. Conecte sua conta ML e importe.</p>}
        {items.map(p => {
          const margin = p.recommended_price && p.cost ? ((p.recommended_price - p.cost) / p.recommended_price) * 100 : null;
          return (
            <Card key={p.id} className="bg-gradient-card overflow-hidden">
              <div className="aspect-video bg-secondary/30 grid place-items-center">
                {p.image_url ? <img src={p.image_url} className="h-full object-contain" /> : <Package className="h-10 w-10 text-muted-foreground/40" />}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{p.title}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Preço atual</span>
                  <span className="font-mono">{p.current_price ? fmtBRL(p.current_price) : "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Recomendado</span>
                  <span className="font-mono text-primary font-bold">{p.recommended_price ? fmtBRL(p.recommended_price) : "—"}</span>
                </div>
                {margin !== null && (
                  <Badge variant={margin < 10 ? "destructive" : margin < 20 ? "secondary" : "default"} className="text-xs">
                    Margem {margin.toFixed(1)}%
                  </Badge>
                )}
                <div className="text-xs text-muted-foreground">
                  {p.last_analyzed_at ? `Última análise: ${format(new Date(p.last_analyzed_at), "dd/MM HH:mm")} por ${profs.get(p.last_analyzed_by) || "—"}` : "Sem análise"}
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id, p.title)} className="w-full text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />Excluir
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
