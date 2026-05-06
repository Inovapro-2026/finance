import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function Configuracoes() {
  const { profile, user } = useAuth();
  const [nome, setNome] = useState(profile?.nome || "");
  const [cargo, setCargo] = useState(profile?.cargo || "");
  const [pwd, setPwd] = useState("");

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles").update({ nome, cargo }).eq("user_id", user!.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Perfil atualizado" });
  };

  const changePwd = async () => {
    if (pwd.length < 6) return toast({ title: "Senha deve ter 6+ caracteres", variant: "destructive" });
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Senha alterada" }); setPwd(""); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Configurações</h1>
      <Card className="p-6 bg-gradient-card space-y-4">
        <h2 className="font-display font-semibold">Perfil</h2>
        <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} className="mt-1" /></div>
        <div><Label>Email</Label><Input value={user?.email || ""} disabled className="mt-1" /></div>
        <div><Label>Cargo</Label><Input value={cargo} onChange={e => setCargo(e.target.value)} className="mt-1" /></div>
        <Button onClick={saveProfile} className="bg-gradient-primary text-primary-foreground">Salvar</Button>
      </Card>

      <Card className="p-6 bg-gradient-card space-y-4">
        <h2 className="font-display font-semibold">Alterar senha</h2>
        <div><Label>Nova senha</Label><Input type="password" value={pwd} onChange={e => setPwd(e.target.value)} className="mt-1" /></div>
        <Button onClick={changePwd} variant="outline">Alterar</Button>
      </Card>
    </div>
  );
}
