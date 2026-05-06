import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const { user, loading, signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  if (loading) return <div className="min-h-screen grid place-items-center">Carregando...</div>;
  if (user) return <Navigate to="/app" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (mode === "forgot") {
      const { error } = await resetPassword(email);
      setSubmitting(false);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Email enviado", description: "Verifique sua caixa de entrada." });
      return;
    }
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast({ title: "Falha no login", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-background bg-mesh grid place-items-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-tight">INOVAPROSHOP</h1>
            <p className="text-xs text-muted-foreground font-mono">Inteligência de Preços para Mercado Livre</p>
          </div>
        </div>

        <Card className="glass p-8 shadow-card-elevated">
          <h2 className="font-display text-xl font-semibold mb-1">
            {mode === "login" ? "Entrar na plataforma" : "Recuperar senha"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "login" ? "Acesso restrito à equipe" : "Enviaremos um link para seu email"}
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="mt-1.5" />
            </div>
            {mode === "login" && (
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5" />
              </div>
            )}
            <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Entrar" : "Enviar link"}
            </Button>
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "forgot" : "login")}
              className="text-xs text-muted-foreground hover:text-primary block w-full text-center"
            >
              {mode === "login" ? "Esqueci minha senha" : "← Voltar para login"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
