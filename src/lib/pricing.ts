// Calculadora de preços para Mercado Livre
// Taxas oficiais aproximadas (clássico ~12%, premium ~17%)
export const ML_FEES: Record<string, number> = {
  classico: 0.12,
  premium: 0.17,
};

export interface PriceInputs {
  cost: number;
  packaging: number;
  shipping: number;
  taxPercent: number;
  operational: number;
  ads: number;
  desiredMargin: number;
  listingType: "classico" | "premium";
}

export interface PriceResults {
  totalCost: number;
  mlFeePercent: number;
  minPrice: number;
  recommendedPrice: number;
  competitivePrice: number;
  premiumPrice: number;
  netProfit: number;
  realMargin: number;
  mlFeeAmount: number;
  taxAmount: number;
  riskLevel: "baixo" | "médio" | "alto";
}

export function calculatePrice(input: PriceInputs): PriceResults {
  const fixedCosts = input.cost + input.packaging + input.shipping + input.operational + input.ads;
  const mlFee = ML_FEES[input.listingType] ?? 0.12;

  // recommended: solve P such that P - P*mlFee - P*tax/100 - fixed = P*margin/100
  const denom = 1 - mlFee - input.taxPercent / 100 - input.desiredMargin / 100;
  const recommended = denom > 0 ? fixedCosts / denom : fixedCosts * 2;

  const denomMin = 1 - mlFee - input.taxPercent / 100;
  const minPrice = denomMin > 0 ? fixedCosts / denomMin : fixedCosts * 2;

  const competitive = recommended * 0.95;
  const premium = recommended * 1.15;

  const mlFeeAmount = recommended * mlFee;
  const taxAmount = recommended * (input.taxPercent / 100);
  const netProfit = recommended - fixedCosts - mlFeeAmount - taxAmount;
  const realMargin = (netProfit / recommended) * 100;

  let risk: "baixo" | "médio" | "alto" = "baixo";
  if (realMargin < 10) risk = "alto";
  else if (realMargin < 20) risk = "médio";

  return {
    totalCost: fixedCosts,
    mlFeePercent: mlFee * 100,
    minPrice,
    recommendedPrice: recommended,
    competitivePrice: competitive,
    premiumPrice: premium,
    netProfit,
    realMargin,
    mlFeeAmount,
    taxAmount,
    riskLevel: risk,
  };
}

export const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
