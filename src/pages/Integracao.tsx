import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { logActivity } from "@/lib/activity";
import { toast } from "@/hooks/use-toast";

export default function Integracao() {
  const [conn, setConn] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("ml_connections").select("*").maybeSingle();
    setConn(data);
  };
  useEffect(() => { load(); }, []);

  const connect = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ml-oauth?action=authorize-url`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
      const j = await res.json();
      if (!j.url) throw new Error(j.error || "Falha ao obter URL");
      window.location.href = j.url;
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const disconnect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ml-oauth?action=disconnect`, {
      headers: { Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY }
    });
    await logActivity({ type: "ml_disconnected", action: "desconectou conta Mercado Livre" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link2 className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold">Mercado Livre</h1>
          <p className="text-muted-foreground text-sm">Conecte sua conta para acesso completo</p>
        </div>
      </div>

      <Card className="p-6 bg-gradient-card max-w-2xl">
        {conn ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <div>
                <div className="font-display font-semibold text-lg">Conectado</div>
                <div className="text-sm text-muted-foreground">@{conn.ml_nickname} (ID: {conn.ml_user_id})</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Token expira em: {new Date(conn.expires_at).toLocaleString("pt-BR")} (renovado automaticamente)</div>
            <Button variant="outline" onClick={disconnect}>Desconectar</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="font-display font-semibold text-lg">Não conectado</div>
                <div className="text-sm text-muted-foreground">Autorize o INOVAPROSHOP a acessar seus anúncios</div>
              </div>
            </div>
            <Button onClick={connect} disabled={loading} className="bg-gradient-primary text-primary-foreground">
              <ExternalLink className="h-4 w-4" />Conectar Mercado Livre
            </Button>
            <div className="text-xs text-muted-foreground space-y-1 pt-3 border-t border-border">
              <p>Acessamos: leitura dos seus anúncios, dados de mercado e métricas.</p>
              <p>Não modificamos seus anúncios sem confirmação.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
