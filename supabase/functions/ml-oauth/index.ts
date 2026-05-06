import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ML_CLIENT_ID = Deno.env.get("ML_CLIENT_ID")!;
const ML_CLIENT_SECRET = Deno.env.get("ML_CLIENT_SECRET")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Public callback (no auth)
  if (action === "callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // user_id
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ml-oauth?action=callback`;

    if (!code || !state) {
      return new Response("Missing code or state", { status: 400 });
    }

    const tokenRes = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tok = await tokenRes.json();
    if (!tokenRes.ok) {
      return new Response(`Token error: ${JSON.stringify(tok)}`, { status: 400 });
    }

    // get user info
    const meRes = await fetch(`https://api.mercadolibre.com/users/me`, {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    });
    const me = await meRes.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await supabase.from("ml_connections").upsert({
      user_id: state,
      ml_user_id: String(me.id ?? ""),
      ml_nickname: me.nickname ?? "",
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      expires_at: new Date(Date.now() + tok.expires_in * 1000).toISOString(),
      scope: tok.scope ?? "",
    }, { onConflict: "user_id" });

    // Redirect to app
    const origin = req.headers.get("referer") || "https://lovable.dev";
    return new Response(
      `<html><body><script>window.location.href='${url.searchParams.get("redirect") || "/integracao"}';</script>Conectado! Redirecionando...</body></html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  }

  // Authed actions
  const authHeader = req.headers.get("Authorization");
  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
    { global: { headers: { Authorization: authHeader ?? "" } } },
  );
  const { data: userData } = await supabaseUser.auth.getUser();
  if (!userData?.user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  if (action === "authorize-url") {
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ml-oauth?action=callback`;
    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${ML_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${userData.user.id}`;
    return new Response(JSON.stringify({ url: authUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "disconnect") {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("ml_connections").delete().eq("user_id", userData.user.id);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response("Unknown action", { status: 400, headers: corsHeaders });
});
