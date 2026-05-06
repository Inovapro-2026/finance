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
  if (!r.ok) throw new Error("Refresh failed: " + JSON.stringify(t));
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

    const body = await req.json().catch(() => ({}));
    const { action, query, siteId = "MLB", itemId } = body;

    let token: string | null = null;
    if (conn) token = await refreshIfNeeded(admin, conn);

    if (action === "search") {
      // Public ML search works even without token
      const url = `https://api.mercadolibre.com/sites/${siteId}/search?q=${encodeURIComponent(query)}&limit=30`;
      const r = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      const data = await r.json();
      const results = (data.results || []).map((it: any) => ({
        id: it.id,
        title: it.title,
        price: it.price,
        currency: it.currency_id,
        thumbnail: it.thumbnail?.replace("http://", "https://"),
        permalink: it.permalink,
        seller_nickname: it.seller?.nickname || `Seller ${it.seller?.id}`,
        seller_id: it.seller?.id,
        free_shipping: !!it.shipping?.free_shipping,
        listing_type: it.listing_type_id,
        condition: it.condition,
        sold_quantity: it.sold_quantity,
      }));
      // stats
      const prices = results.map((r: any) => r.price).filter((p: number) => p > 0).sort((a: number, b: number) => a - b);
      const stats = prices.length ? {
        total: results.length,
        min: prices[0],
        max: prices[prices.length - 1],
        avg: prices.reduce((s: number, p: number) => s + p, 0) / prices.length,
        median: prices[Math.floor(prices.length / 2)],
        free_shipping_pct: (results.filter((r: any) => r.free_shipping).length / results.length) * 100,
      } : null;
      return new Response(JSON.stringify({ results, stats }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "my-items") {
      if (!token || !conn) return new Response(JSON.stringify({ error: "ML não conectado" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const r = await fetch(`https://api.mercadolibre.com/users/${conn.ml_user_id}/items/search?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      const ids = (data.results || []).slice(0, 20);
      if (!ids.length) return new Response(JSON.stringify({ items: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const itemsRes = await fetch(`https://api.mercadolibre.com/items?ids=${ids.join(",")}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = await itemsRes.json();
      return new Response(JSON.stringify({ items: items.map((i: any) => i.body) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "item") {
      const r = await fetch(`https://api.mercadolibre.com/items/${itemId}`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      return new Response(JSON.stringify(await r.json()), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
