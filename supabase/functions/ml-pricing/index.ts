import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ML_CLIENT_ID = Deno.env.get("ML_CLIENT_ID")!;
const ML_CLIENT_SECRET = Deno.env.get("ML_CLIENT_SECRET")!;

async function refreshIfNeeded(admin: any, conn: any) {
  if (new Date(conn.expires_at).getTime() > Date.now() + 60_000) return conn.access_token;
  const r = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: ML_CLIENT_ID,
      client_secret: ML_CLIENT_SECRET,
      refresh_token: conn.refresh_token,
    }),
  });
  const t = await r.json();
  if (!r.ok) throw new Error("Refresh failed");
  await admin.from("ml_connections").update({
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
  }).eq("user_id", conn.user_id);
  return t.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader ?? "" } } },
    );
    const { data: userData } = await supabaseUser.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: conn } = await admin.from("ml_connections").select("*").eq("user_id", userData.user.id).maybeSingle();

    let token: string | null = null;
    if (conn) {
      try { token = await refreshIfNeeded(admin, conn); } catch (e) {
        console.error("[ml-pricing] token refresh failed:", e);
      }
    }

    const body = await req.json().catch(() => ({}));
    const { title, price } = body;

    if (!title) {
      return new Response(JSON.stringify({ error: "Title is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 1. Search ML for category prediction and competition
    const searchUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(title)}&limit=20`;
    const searchRes = await fetch(searchUrl, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
    const searchData = await searchRes.json();

    const results = (searchData.results || []);
    const prices = results.map((r: any) => r.price).filter((p: number) => p > 0).sort((a: number, b: number) => a - b);

    const competition = {
      total: results.length,
      min: prices[0] || 0,
      max: prices[prices.length - 1] || 0,
      avg: prices.length ? prices.reduce((s: number, p: number) => s + p, 0) / prices.length : 0,
      median: prices.length ? prices[Math.floor(prices.length / 2)] : 0,
      free_shipping_pct: results.length ? (results.filter((r: any) => r.shipping?.free_shipping).length / results.length) * 100 : 0,
    };

    // 2. Get category from first result or category predictor
    let categoryId = "";
    let categoryName = "";
    let mlFeePercent: number | null = null;
    let feeSource = "fallback";

    if (results.length > 0 && results[0].category_id) {
      categoryId = results[0].category_id;
    }

    // Try category predictor
    if (!categoryId) {
      try {
        const predRes = await fetch(`https://api.mercadolibre.com/sites/MLB/domain_discovery/search?q=${encodeURIComponent(title)}`);
        const predData = await predRes.json();
        if (Array.isArray(predData) && predData.length > 0) {
          categoryId = predData[0].category_id || "";
          categoryName = predData[0].category_name || "";
        }
      } catch (e) {
        console.log("[ml-pricing] category prediction failed:", e);
      }
    }

    // Get category name if we have id but no name
    if (categoryId && !categoryName) {
      try {
        const catRes = await fetch(`https://api.mercadolibre.com/categories/${categoryId}`);
        const catData = await catRes.json();
        categoryName = catData.name || categoryId;
      } catch {}
    }

    // 3. Get real fee from ML API
    if (categoryId && price && price > 0) {
      try {
        // Try listing fees endpoint
        const feeUrl = `https://api.mercadolibre.com/sites/MLB/listing_prices?category_id=${categoryId}&price=${price}`;
        const feeRes = await fetch(feeUrl, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
        if (feeRes.ok) {
          const feeData = await feeRes.json();
          // Find classic and premium listing types
          const classicFee = feeData.find?.((f: any) => f.listing_type_id === "gold_special" || f.listing_type_id === "gold");
          const premiumFee = feeData.find?.((f: any) => f.listing_type_id === "gold_pro");

          if (classicFee) {
            const totalFee = classicFee.sale_fee_amount || 0;
            mlFeePercent = price > 0 ? (totalFee / price) * 100 : null;
            feeSource = "api";
          }
        }
      } catch (e) {
        console.log("[ml-pricing] fee lookup failed:", e);
      }
    }

    // 4. Try to get shipping estimate
    let shippingCost = 0;
    let shippingSource = "default";

    // Shipping is complex on ML, use free_shipping_pct as indicator
    if (competition.free_shipping_pct > 70) {
      shippingCost = 0;
      shippingSource = "free_shipping_common";
    }

    return new Response(JSON.stringify({
      category_id: categoryId,
      category_name: categoryName,
      ml_fee_percent: mlFeePercent,
      fee_source: feeSource,
      shipping_cost: shippingCost,
      shipping_source: shippingSource,
      competition,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("[ml-pricing] error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
