import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { calculatePrice, fmtBRL, type PriceInputs } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logActivity } from "@/lib/activity";
import { toast } from "@/hooks/use-toast";
import { Calculator, Save, Loader2, ChevronDown, AlertTriangle, Info } from "lucide-react";

interface MlPricingData {
  category_id: string;
  category_name: string;
  ml_fee_percent: number | null;
  fee_source: string;
  shipping_cost: number;
  shipping_source: string;
  competition: {
    total: number;
    min: number;
    max: number;
    avg: number;
    median: number;
    free_shipping_pct: number;
  };
}

interface UserDefaults {
  taxPercent: number;
  operational: number;
  desiredMargin: number;
}

export default function Calculadora() {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [cost, setCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [mlData, setMlData] = useState<MlPricingData | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Advanced overrides
  const [packaging, setPackaging] = useState(2);
  const [shipping, setShipping] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [operational, setOperational] = useState(0);
  const [ads, setAds] = useState(0);
  const [desiredMargin, setDesiredMargin] = useState(25);
  const [listingType, setListingType] = useState<"classico" | "premium">("classico");
  const [mlFeeOverride, setMlFeeOverride] = useState<number | null>(null);

  // Load user defaults from settings
  useEffect(() => {
    if (!user) return;
    supabase.from("user_settings").select("preferences").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.preferences) {
          const prefs = data.preferences as any;
          if (prefs.taxPercent !== undefined) setTaxPercent(prefs.taxPercent);
          if (prefs.operational !== undefined) setOperational(prefs.operational);
          if (prefs.desiredMargin !== undefined) setDesiredMargin(prefs.desiredMargin);
        }
      });
  }, [user]);

  const handleCalculate = async () => {
    if (!title.trim()) return toast({ title: "Informe o título do produto", variant: "destructive" });
    if (cost <= 0) return toast({ title: "Informe o custo do produto", variant: "destructive" });

    setLoading(true);
    setCalculated(false);
    setWarnings([]);
    const newWarnings: string[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Estimate initial price for fee lookup
      const estimatedPrice = cost * 2;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ml-pricing`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, price: estimatedPrice }),
      });

      if (res.ok) {
        const data: MlPricingData = await res.json();
        setMlData(data);

        // Apply ML data
        if (data.shipping_cost !== undefined) setShipping(data.shipping_cost);
        if (data.shipping_source === "default") {
          newWarnings.push("Frete não calculado pela API. Usando R$ 0,00 temporariamente.");
        }

        if (data.ml_fee_percent !== null && data.fee_source === "api") {
          setMlFeeOverride(data.ml_fee_percent);
        } else {
          setMlFeeOverride(null);
          newWarnings.push("Taxa estimada usada por falta de retorno da API.");
        }
      } else {
        newWarnings.push("Não foi possível consultar dados do Mercado Livre.");
      }
    } catch (e: any) {
      console.error("ML pricing error:", e);
      newWarnings.push("Erro ao buscar dados do Mercado Livre: " + e.message);
    }

    setWarnings(newWarnings);
    setCalculated(true);
    setLoading(false);
  };

  const inputs: PriceInputs = {
    cost,
    packaging,
    shipping,
    taxPercent,
    operational,
    ads,
    desiredMargin,
    listingType,
  };

  const r = calculatePrice(inputs);
  const effectiveFeePercent = mlFeeOverride !== null ? mlFeeOverride : r.mlFeePercent;

  const save = async () => {
    if (!title) return toast({ title: "Informe o título", variant: "destructive" });
    const { error } = await supabase.from("calculations").insert({
      user_id: user!.id, title, sku, inputs: inputs as any, results: r as any,
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    const userName = profile?.nome || "Usuário";
    await logActivity({ type: "price_calculation", action: `${userName} calculou preço do produto`, target: title });
    toast({ title: "Cálculo salvo com sucesso!" });
  };

  const riskColor = r.riskLevel === "alto" ? "destructive" : r.riskLevel === "médio" ? "secondary" : "default";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold">Calculadora de Preços</h1>
          <p className="text-muted-foreground text-sm">Preencha título, SKU e custo — o resto é automático</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card className="p-6 bg-gradient-card space-y-4">
          <h3 className="font-display font-semibold">Dados do produto</h3>

          <div className="space-y-3">
            <div>
              <Label>Título do produto</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Fruteira De Mesa 2 Andares Em Metal E Madeira"
                className="mt-1"
              />
            </div>
            <div>
              <Label>SKU</Label>
              <Input
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="Ex: FRU-5742-4622"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Custo do produto (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={cost || ""}
                onChange={e => setCost(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 47"
                className="mt-1 font-mono"
              />
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full bg-gradient-primary text-primary-foreground"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            {loading ? "Buscando dados..." : "Calcular preço ideal"}
          </Button>

          {/* Advanced mode */}
          {calculated && (
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-muted-foreground text-sm">
                  Modo avançado
                  <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3 border-t border-border mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Embalagem (R$)" v={packaging} on={setPackaging} />
                  <NumField label="Frete (R$)" v={shipping} on={setShipping} />
                  <NumField label="Imposto (%)" v={taxPercent} on={setTaxPercent} />
                  <NumField label="Custo operacional (R$)" v={operational} on={setOperational} />
                  <NumField label="Custo de Ads (R$)" v={ads} on={setAds} />
                  <NumField label="Margem desejada (%)" v={desiredMargin} on={setDesiredMargin} />
                  <div>
                    <Label>Tipo de anúncio</Label>
                    <Select value={listingType} onValueChange={(v: any) => setListingType(v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classico">Clássico (~12%)</SelectItem>
                        <SelectItem value="premium">Premium (~17%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </Card>

        {/* Results Card */}
        {calculated && (
          <Card className="p-6 bg-gradient-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Resultado</h3>
              <Badge variant={riskColor as any}>Risco {r.riskLevel}</Badge>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="mb-4 space-y-1">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-yellow-500 bg-yellow-500/10 rounded p-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ML info */}
            {mlData && (
              <div className="mb-4 p-3 rounded bg-muted/50 space-y-1 text-sm">
                {mlData.category_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria</span>
                    <span className="font-medium">{mlData.category_name}</span>
                  </div>
                )}
                {mlData.competition.total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Concorrentes encontrados</span>
                    <span className="font-medium">{mlData.competition.total}</span>
                  </div>
                )}
                {mlData.competition.avg > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço médio concorrência</span>
                    <span className="font-medium">{fmtBRL(mlData.competition.avg)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <ResultRow label="Custo do produto" value={fmtBRL(cost)} />
              <ResultRow label="Embalagem" value={fmtBRL(packaging)} />
              <ResultRow label={`Taxa ML (${effectiveFeePercent.toFixed(1)}%)`} value={fmtBRL(r.mlFeeAmount)} />
              <ResultRow label="Tipo de anúncio" value={listingType === "premium" ? "Premium" : "Clássico"} />
              <ResultRow label="Frete estimado" value={fmtBRL(shipping)} />
              <hr className="border-border" />
              <ResultRow label="Preço mínimo (sem prejuízo)" value={fmtBRL(r.minPrice)} />
              <ResultRow label="Preço recomendado" value={fmtBRL(r.recommendedPrice)} highlight />
              <ResultRow label="Preço competitivo" value={fmtBRL(r.competitivePrice)} />
              <ResultRow label="Preço premium" value={fmtBRL(r.premiumPrice)} />
              <hr className="border-border" />
              <ResultRow label="Lucro líquido estimado" value={fmtBRL(r.netProfit)} />
              <ResultRow label="Margem real" value={`${r.realMargin.toFixed(1)}%`} highlight />
            </div>

            <Button onClick={save} className="w-full mt-4 bg-gradient-primary text-primary-foreground">
              <Save className="h-4 w-4" />Salvar cálculo
            </Button>
          </Card>
        )}

        {!calculated && (
          <Card className="p-6 bg-gradient-card flex flex-col items-center justify-center text-center min-h-[300px]">
            <Info className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Preencha os dados e clique em <strong>"Calcular preço ideal"</strong> para ver o resultado.</p>
            <p className="text-xs text-muted-foreground mt-2">Taxas, categoria e concorrência são buscados automaticamente no Mercado Livre.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function NumField({ label, v, on }: { label: string; v: number; on: (n: number) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" step="0.01" value={v} onChange={e => on(parseFloat(e.target.value) || 0)} className="mt-1 font-mono" />
    </div>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-mono ${highlight ? "text-primary font-bold text-lg" : ""}`}>{value}</span>
    </div>
  );
}
