import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logActivity } from "@/lib/activity";
import { fmtBRL } from "@/lib/pricing";
import { Search, ExternalLink, Loader2, TrendingUp, Truck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Mercado() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      // Check recent searches
      const { data: recent } = await supabase
        .from("market_analyses")
        .select("id, user_id, created_at, profiles:user_id(nome)")
        .ilike("query", q)
        .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (recent && recent.length > 0 && recent[0].user_id !== user!.id) {
        const { data: prof } = await supabase.from("profiles").select("nome").eq("user_id", recent[0].user_id).maybeSingle();
        toast({ title: "⚠️ Atenção", description: `${prof?.nome || "Outro usuário"} já analisou "${q}" nas últimas 24h.` });
      }

      const { data, error } = await supabase.functions.invoke("ml-api", { body: { action: "search", query: q } });
      if (error) throw error;
      setResults(data.results || []);
      setStats(data.stats);

      const { data: ana } = await supabase.from("market_analyses").insert({
        user_id: user!.id, query: q,
        total_results: data.stats?.total || 0,
        min_price: data.stats?.min, max_price: data.stats?.max,
        avg_price: data.stats?.avg, median_price: data.stats?.median,
        free_shipping_pct: data.stats?.free_shipping_pct,
      }).select().single();

      if (ana && data.results?.length) {
        await supabase.from("competitors").insert(data.results.map((r: any) => ({
          analysis_id: ana.id, ml_item_id: r.id, title: r.title, price: r.price,
          image_url: r.thumbnail, permalink: r.permalink, seller_nickname: r.seller_nickname,
          free_shipping: r.free_shipping, listing_type: r.listing_type,
          condition: r.condition, sold_quantity: r.sold_quantity,
        })));
      }
      await logActivity({ type: "market_analysis", action: "analisou concorrência de", target: q });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold">Análise de Mercado</h1>
          <p className="text-muted-foreground text-sm">Concorrentes reais do Mercado Livre</p>
        </div>
      </div>

      <Card className="p-4 bg-gradient-card">
        <form onSubmit={search} className="flex gap-2">
          <Input placeholder='Ex: "Fruteira de mesa 2 andares"' value={q} onChange={e => setQ(e.target.value)} className="flex-1" />
          <Button type="submit" disabled={loading} className="bg-gradient-primary text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Pesquisar
          </Button>
        </form>
      </Card>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatBox label="Resultados" value={stats.total} />
          <StatBox label="Menor preço" value={fmtBRL(stats.min)} />
          <StatBox label="Maior preço" value={fmtBRL(stats.max)} />
          <StatBox label="Médio" value={fmtBRL(stats.avg)} highlight />
          <StatBox label="Frete grátis" value={`${stats.free_shipping_pct.toFixed(0)}%`} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map(r => (
          <Card key={r.id} className="overflow-hidden bg-gradient-card hover:border-primary/40 transition-colors">
            <div className="aspect-square bg-secondary/30 grid place-items-center overflow-hidden">
              {r.thumbnail ? <img src={r.thumbnail} alt={r.title} className="w-full h-full object-contain" loading="lazy" /> : <span className="text-muted-foreground text-xs">sem imagem</span>}
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{r.title}</h3>
              <div className="text-xl font-display font-bold text-primary">{fmtBRL(r.price)}</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {r.free_shipping && <Badge variant="secondary" className="text-[10px] gap-1"><Truck className="h-3 w-3" />Grátis</Badge>}
                <Badge variant="outline" className="text-[10px]">{r.listing_type}</Badge>
                {r.sold_quantity > 0 && <Badge variant="outline" className="text-[10px]">{r.sold_quantity} vendidos</Badge>}
              </div>
              <div className="text-xs text-muted-foreground truncate">@{r.seller_nickname}</div>
              <a href={r.permalink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver anúncio <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight }: any) {
  return (
    <Card className={`p-3 bg-gradient-card ${highlight ? "border-primary/40" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-display font-bold ${highlight ? "text-primary text-lg" : "text-base"}`}>{value}</div>
    </Card>
  );
}
