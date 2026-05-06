import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o assistente IA do INOVAPROSHOP, especialista em vendas no Mercado Livre Brasil.
Ajude Maicon e Rony a:
- Melhorar títulos de anúncios para SEO do Mercado Livre (até 60 caracteres, palavras-chave principais no início)
- Reescrever descrições com foco em conversão
- Sugerir palavras-chave de cauda longa
- Avaliar preço, fotos e qualidade do anúncio
- Identificar pontos fracos vs concorrência
Seja prático, direto e em português. Use markdown.`;

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

    const { messages, imageUrl } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const userMessages = messages.map((m: any) => {
      if (m.role === "user" && imageUrl && m === messages[messages.length - 1]) {
        return {
          role: "user",
          content: [
            { type: "text", text: m.content },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...userMessages],
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Limite atingido. Tente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos no workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) return new Response(JSON.stringify({ error: await r.text() }), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const data = await r.json();
    return new Response(JSON.stringify({ content: data.choices[0].message.content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
