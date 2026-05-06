import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ActivityType = Database["public"]["Enums"]["activity_type"];

export async function logActivity(params: {
  type: ActivityType;
  action: string;
  target?: string;
  product_id?: string;
  details?: any;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("activities").insert({
    user_id: user.id,
    type: params.type,
    action: params.action,
    target: params.target ?? null,
    product_id: params.product_id ?? null,
    details: params.details ?? null,
  });
}
