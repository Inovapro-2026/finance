import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ML_CLIENT_ID = Deno.env.get("ML_CLIENT_ID")!;
const ML_CLIENT_SECRET = Deno.env.get("ML_CLIENT_SECRET")!;
const ML_REDIRECT_URI = "https://inovaproshop.lovable.app/callback";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Auth helper
  const getUser = async () => {
    const authHeader = req.headers.get("Authorization");
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader ?? "" } } },
    );
    const { data } = await supabaseUser.auth.getUser();
    return data?.user ?? null;
  };

  // Generate authorization URL
  if (action === "authorize-url") {
    const user = await getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${ML_CLIENT_ID}&redirect_uri=${encodeURIComponent(ML_REDIRECT_URI)}&state=${user.id}`;
    console.log("[ml-oauth] authorize-url generated, redirect_uri:", ML_REDIRECT_URI, "client_id:", ML_CLIENT_ID);
    return new Response(JSON.stringify({ url: authUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Exchange code for token (called from frontend /callback page)
  if (action === "exchange") {
    const user = await getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let body: any;
    try { body = await req.json(); } catch { body = {}; }
    const code = body.code;

    if (!code) {
      return new Response(JSON.stringify({ error: "Missing code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("[ml-oauth] exchange - code:", code, "redirect_uri:", ML_REDIRECT_URI, "client_id:", ML_CLIENT_ID);

    const tokenRes = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        code,
        redirect_uri: ML_REDIRECT_URI,
      }),
    });
    const tok = await tokenRes.json();
    console.log("[ml-oauth] token response status:", tokenRes.status, "body:", JSON.stringify(tok));

    if (!tokenRes.ok) {
      return new Response(JSON.stringify({ error: `ML token error: ${tok.message || tok.error || JSON.stringify(tok)}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user info
    const meRes = await fetch("https://api.mercadolibre.com/users/me", {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    });
    const me = await meRes.json();

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("ml_connections").upsert({
      user_id: user.id,
      ml_user_id: String(me.id ?? ""),
      ml_nickname: me.nickname ?? "",
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      expires_at: new Date(Date.now() + tok.expires_in * 1000).toISOString(),
      scope: tok.scope ?? "",
    }, { onConflict: "user_id" });

    return new Response(JSON.stringify({ ok: true, nickname: me.nickname }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Disconnect
  if (action === "disconnect") {
    const user = await getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("ml_connections").delete().eq("user_id", user.id);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
