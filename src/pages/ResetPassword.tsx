import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // hash recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) setReady(true);
    else setReady(true);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Senha atualizada" }); navigate("/app"); }
  };

  if (!ready) return null;
  return (
    <div className="min-h-screen grid place-items-center bg-background bg-mesh p-6">
      <Card className="glass p-8 w-full max-w-md">
        <h2 className="font-display text-xl font-semibold mb-4">Definir nova senha</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Nova senha</Label>
            <Input type="password" required minLength={6} value={pwd} onChange={e => setPwd(e.target.value)} className="mt-1.5" />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground">Salvar</Button>
        </form>
      </Card>
    </div>
  );
}
