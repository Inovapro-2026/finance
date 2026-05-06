import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function MlCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processando autorização...");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    console.log("[ML Callback] code:", code, "state:", state);

    if (!code) {
      setStatus("Erro: código de autorização não encontrado na URL.");
      toast({ title: "Erro", description: "Código de autorização ausente", variant: "destructive" });
      setTimeout(() => navigate("/app/integracao"), 3000);
      return;
    }

    const exchangeToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setStatus("Erro: você precisa estar logado.");
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        // Validate state matches user id
        if (state && state !== session.user.id) {
          console.warn("[ML Callback] state mismatch:", state, "vs", session.user.id);
        }

        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ml-oauth?action=exchange`;
        console.log("[ML Callback] calling edge function:", url);

        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        const result = await res.json();
        console.log("[ML Callback] result:", result);

        if (!res.ok) {
          throw new Error(result.error || "Falha na troca do token");
        }

        setStatus("Conectado com sucesso! Redirecionando...");
        toast({ title: "Mercado Livre conectado!", description: `@${result.nickname || ""}` });
        setTimeout(() => navigate("/app/integracao"), 1500);
      } catch (e: any) {
        console.error("[ML Callback] error:", e);
        setStatus(`Erro: ${e.message}`);
        toast({ title: "Erro ao conectar", description: e.message, variant: "destructive" });
        setTimeout(() => navigate("/app/integracao"), 4000);
      }
    };

    exchangeToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
