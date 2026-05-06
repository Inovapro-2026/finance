import { ArrowRight, BarChart3, Brain, Calculator, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Calculator, title: "Calculadora Inteligente", desc: "Preço ideal, mínimo e premium com taxas reais do Mercado Livre." },
  { icon: BarChart3, title: "Análise de Mercado", desc: "Concorrentes reais, distribuição de preços, frete grátis e patrocinados." },
  { icon: Brain, title: "IA Estratégica", desc: "Recomenda quando entrar, faixa ideal e nível de risco." },
  { icon: TrendingUp, title: "Monitoramento", desc: "Histórico de preços e alertas quando a concorrência mexe." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background bg-mesh relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.15),transparent_60%)] pointer-events-none" />

      <header className="relative z-10 container flex items-center justify-between py-6">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="font-display font-bold text-lg tracking-tight">
            PREÇOML <span className="text-gradient-primary">AI</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
          <a href="#how" className="hover:text-foreground transition-colors">Como funciona</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Preços</a>
        </nav>
        <Button variant="outline" size="sm" disabled>Entrar (em breve)</Button>
      </header>

      <main className="relative z-10 container">
        <section className="pt-16 pb-24 text-center max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-muted-foreground mb-8">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Inteligência de precificação para Mercado Livre
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
            Precifique com<br />
            <span className="text-gradient-primary">precisão cirúrgica</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Conecte sua conta do Mercado Livre, calcule o preço ideal com taxas reais e
            decida com base em concorrência ao vivo + IA estratégica.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow h-12 px-7 font-semibold">
              Começar grátis
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-7">
              Ver demonstração
            </Button>
          </div>
        </section>

        <section id="features" className="pb-24 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group relative p-6 rounded-2xl bg-gradient-card border border-border shadow-card-elevated hover:border-primary/40 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        <section className="pb-24">
          <div className="rounded-3xl p-8 md:p-12 bg-gradient-card border border-border shadow-card-elevated text-center">
            <div className="inline-flex h-12 w-12 rounded-full bg-warning/15 items-center justify-center mb-4">
              <Sparkles className="h-5 w-5 text-warning" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">Construindo seu workspace…</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Backend, autenticação, integração com Mercado Livre e IA estão sendo configurados.
              Em instantes você poderá conectar sua conta e começar a precificar.
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 container py-8 border-t border-border text-center text-xs text-muted-foreground">
        © 2026 PREÇOML AI · Inteligência de precificação para vendedores
      </footer>
    </div>
  );
};

export default Index;
