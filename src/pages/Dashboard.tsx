import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Activity as ActivityIcon, AlertTriangle, TrendingUp, Link2, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ products: 0, avgMargin: 0, atRisk: 0, todayAnalyses: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [mlConn, setMlConn] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const [pRes, aRes, alRes, mRes, mlRes] = await Promise.all([
        supabase.from("products").select("id, recommended_price, cost"),
        supabase.from("activities").select("*, profiles!activities_user_id_fkey(nome)").order("created_at", { ascending: false }).limit(8),
        supabase.from("alerts").select("*").eq("read", false).order("created_at", { ascending: false }).limit(5),
        supabase.from("market_analyses").select("id").gte("created_at", today.toISOString()),
        supabase.from("ml_connections").select("ml_nickname, expires_at").maybeSingle(),
      ]);
      const products = pRes.data || [];
      const margins = products.map((p: any) => p.recommended_price && p.cost ? ((p.recommended_price - p.cost) / p.recommended_price) * 100 : null).filter((m): m is number => m !== null);
      const avg = margins.length ? margins.reduce((s, m) => s + m, 0) / margins.length : 0;
      setStats({
        products: products.length,
        avgMargin: avg,
        atRisk: margins.filter(m => m < 10).length,
        todayAnalyses: mRes.data?.length || 0,
      });
      // fetch profile names manually since we can't do FK join easily
      const acts = aRes.data || [];
      const userIds = [...new Set(acts.map((a: any) => a.user_id))];
      const { data: profs } = await supabase.from("profiles").select("user_id, nome").in("user_id", userIds);
      const nameMap = new Map((profs || []).map((p: any) => [p.user_id, p.nome]));
      setRecent(acts.map((a: any) => ({ ...a, nome: nameMap.get(a.user_id) || "?" })));
      setAlerts(alRes.data || []);
      setMlConn(mlRes.data);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Olá, {profile?.nome?.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground">Visão geral da operação no Mercado Livre</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Produtos cadastrados" value={stats.products} color="primary" />
        <StatCard icon={TrendingUp} label="Margem média" value={`${stats.avgMargin.toFixed(1)}%`} color="info" />
        <StatCard icon={AlertTriangle} label="Em risco" value={stats.atRisk} color="warning" />
        <StatCard icon={ActivityIcon} label="Análises hoje" value={stats.todayAnalyses} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 bg-gradient-card">
          <h3 className="font-display font-semibold text-lg mb-4">Atividades recentes</h3>
          <div className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>}
            {recent.map(a => (
              <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center text-primary text-xs font-semibold">
                  {a.nome?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm"><span className="font-medium">{a.nome}</span> {a.action}{a.target && <span className="text-muted-foreground"> — "{a.target}"</span>}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5 bg-gradient-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-sm">Mercado Livre</h3>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </div>
            {mlConn ? (
              <>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /><span className="text-sm">Conectado</span></div>
                <p className="text-xs text-muted-foreground mt-1">@{mlConn.ml_nickname}</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" /><span className="text-sm">Desconectado</span></div>
                <Link to="/app/integracao" className="text-xs text-primary hover:underline mt-2 block">Conectar agora →</Link>
              </>
            )}
          </Card>

          <Card className="p-5 bg-gradient-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-sm">Alertas</h3>
              <Badge variant="secondary" className="text-xs">{alerts.length}</Badge>
            </div>
            {alerts.length === 0 && <p className="text-xs text-muted-foreground">Nenhum alerta.</p>}
            <div className="space-y-2">
              {alerts.map(a => (
                <div key={a.id} className="text-xs p-2 rounded bg-secondary/50 border-l-2 border-warning">
                  <div className="font-medium">{a.title}</div>
                  {a.message && <div className="text-muted-foreground mt-0.5">{a.message}</div>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colorMap: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    info: "text-info bg-info/10",
    warning: "text-warning bg-warning/10",
    accent: "text-accent bg-accent/10",
  };
  return (
    <Card className="p-5 bg-gradient-card">
      <div className={`h-10 w-10 rounded-lg grid place-items-center mb-3 ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-display font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </Card>
  );
}
