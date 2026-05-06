import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INITIAL_USERS = [
  { email: "maiconsillva2025@gmail.com", password: "1285041", nome: "Maicon Silva", cargo: "Sócio", role: "admin" },
  { email: "ronydias642@gmail.com", password: "1285041", nome: "Rony Dias", cargo: "Sócio", role: "operador" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: any[] = [];
  for (const u of INITIAL_USERS) {
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users.find((x: any) => x.email === u.email);
    if (found) {
      // Ensure role exists
      const { data: roleExists } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", found.id)
        .eq("role", u.role)
        .maybeSingle();
      if (!roleExists) {
        await supabase.from("user_roles").upsert(
          { user_id: found.id, role: u.role },
          { onConflict: "user_id,role" }
        );
      }
      results.push({ email: u.email, status: "exists", role: u.role });
      continue;
    }
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { nome: u.nome, cargo: u.cargo },
    });
    if (error) {
      results.push({ email: u.email, status: "error", error: error.message });
    } else {
      await supabase.from("user_roles").insert({ user_id: data.user!.id, role: u.role });
      results.push({ email: u.email, status: "created", role: u.role });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
