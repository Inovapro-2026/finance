import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import {
  LayoutDashboard, Calculator, TrendingUp, Activity, Sparkles,
  MessagesSquare, Package, Bell, Link2, LogOut, Settings, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const nav = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/app/calculadora", icon: Calculator, label: "Calculadora" },
  { to: "/app/mercado", icon: TrendingUp, label: "Análise de Mercado" },
  { to: "/app/produtos", icon: Package, label: "Meus Produtos" },
  { to: "/app/atividades", icon: Activity, label: "Atividades" },
  { to: "/app/ia", icon: Sparkles, label: "Chat com IA" },
  { to: "/app/equipe", icon: MessagesSquare, label: "Chat da Equipe" },
  { to: "/app/alertas", icon: Bell, label: "Alertas" },
  { to: "/app/integracao", icon: Link2, label: "Mercado Livre" },
];

export default function AppLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;

  const initials = (profile?.nome || user.email || "U").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display font-bold text-base text-sidebar-foreground tracking-tight">INOVAPROSHOP</div>
              <div className="text-[10px] text-muted-foreground font-mono">v1.0 BETA</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">{profile?.nome || "Usuário"}</div>
              <div className="text-xs text-muted-foreground truncate">{profile?.cargo || "Membro"}</div>
            </div>
          </div>
          <div className="flex gap-1 mt-2">
            <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => navigate("/app/configuracoes")}>
              <Settings className="h-3.5 w-3.5 mr-1" />Conta
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={async () => { await signOut(); navigate("/login"); }}>
              <LogOut className="h-3.5 w-3.5 mr-1" />Sair
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
          <Outlet key={loc.pathname} />
        </div>
      </main>
    </div>
  );
}
