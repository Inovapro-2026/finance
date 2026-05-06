import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { calculatePrice, fmtBRL, type PriceInputs } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logActivity } from "@/lib/activity";
import { toast } from "@/hooks/use-toast";
import { Calculator, Save } from "lucide-react";

export default function Calculadora() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [inputs, setInputs] = useState<PriceInputs>({
    cost: 0, packaging: 0, shipping: 0, taxPercent: 0,
    operational: 0, ads: 0, desiredMargin: 25, listingType: "classico",
  });

  const r = calculatePrice(inputs);
  const set = <K extends keyof PriceInputs>(k: K, v: PriceInputs[K]) => setInputs(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!title) return toast({ title: "Informe o título", variant: "destructive" });
    const { error } = await supabase.from("calculations").insert({
      user_id: user!.id, title, sku, inputs: inputs as any, results: r as any,
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    await logActivity({ type: "price_calculation", action: "calculou preço de", target: title });
    toast({ title: "Cálculo salvo" });
  };

  const riskColor = r.riskLevel === "alto" ? "destructive" : r.riskLevel === "médio" ? "secondary" : "default";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold">Calculadora de Preços</h1>
          <p className="text-muted-foreground text-sm">Considera taxas reais do Mercado Livre</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-card space-y-4">
          <h3 className="font-display font-semibold">Dados do produto</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" /></div>
            <div><Label>SKU</Label><Input value={sku} onChange={e => setSku(e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Tipo de anúncio</Label>
              <Select value={inputs.listingType} onValueChange={(v: any) => set("listingType", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="classico">Clássico (~12%)</SelectItem>
                  <SelectItem value="premium">Premium (~17%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <NumField label="Custo do produto" v={inputs.cost} on={v => set("cost", v)} />
            <NumField label="Embalagem" v={inputs.packaging} on={v => set("packaging", v)} />
            <NumField label="Frete" v={inputs.shipping} on={v => set("shipping", v)} />
            <NumField label="Imposto (%)" v={inputs.taxPercent} on={v => set("taxPercent", v)} />
            <NumField label="Custo operacional" v={inputs.operational} on={v => set("operational", v)} />
            <NumField label="Custo de Ads" v={inputs.ads} on={v => set("ads", v)} />
            <NumField label="Margem desejada (%)" v={inputs.desiredMargin} on={v => set("desiredMargin", v)} />
          </div>
          <Button onClick={save} className="w-full bg-gradient-primary text-primary-foreground"><Save className="h-4 w-4" />Salvar cálculo</Button>
        </Card>

        <Card className="p-6 bg-gradient-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Resultado</h3>
            <Badge variant={riskColor as any}>Risco {r.riskLevel}</Badge>
          </div>
          <div className="space-y-3">
            <ResultRow label="Preço mínimo" value={fmtBRL(r.minPrice)} />
            <ResultRow label="Preço recomendado" value={fmtBRL(r.recommendedPrice)} highlight />
            <ResultRow label="Preço competitivo" value={fmtBRL(r.competitivePrice)} />
            <ResultRow label="Preço premium" value={fmtBRL(r.premiumPrice)} />
            <hr className="border-border" />
            <ResultRow label="Custo total" value={fmtBRL(r.totalCost)} />
            <ResultRow label={`Taxa ML (${r.mlFeePercent.toFixed(0)}%)`} value={fmtBRL(r.mlFeeAmount)} />
            <ResultRow label="Imposto" value={fmtBRL(r.taxAmount)} />
            <ResultRow label="Lucro líquido" value={fmtBRL(r.netProfit)} />
            <ResultRow label="Margem real" value={`${r.realMargin.toFixed(1)}%`} highlight />
          </div>
        </Card>
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
function ResultRow({ label, value, highlight }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-mono ${highlight ? "text-primary font-bold text-lg" : ""}`}>{value}</span>
    </div>
  );
}
