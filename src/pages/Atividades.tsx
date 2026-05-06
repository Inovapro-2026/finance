import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity as ActivityIcon, AlertTriangle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Atividades() {
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [recentDuplicates, setRecentDuplicates] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    (async () => {
      const { data: profs } = await supabase.from("profiles").select("user_id, nome");
      setUsers(profs || []);
      const nameMap = new Map((profs || []).map((p: any) => [p.user_id, p.nome]));

      const { data } = await supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(200);
      const enriched = (data || []).map(a => ({ ...a, nome: nameMap.get(a.user_id) || "?" }));
      setItems(enriched);

      // Detectar pesquisas duplicadas recentes (últimas 24h, mesmo target, usuários diferentes)
      const dups = new Map<string, any>();
      const last24h = enriched.filter(a => a.target && new Date(a.created_at).getTime() > Date.now() - 24*3600*1000);
      const byTarget = new Map<string, any[]>();
      last24h.forEach(a => {
        const key = a.target!.toLowerCase();
        if (!byTarget.has(key)) byTarget.set(key, []);
        byTarget.get(key)!.push(a);
      });
      byTarget.forEach((arr, key) => {
        const usuarios = new Set(arr.map(a => a.user_id));
        if (usuarios.size > 1) dups.set(key, arr);
      });
      setRecentDuplicates(dups);
    })();
  }, []);

  const filtered = items.filter(a => {
    if (filter !== "all" && a.user_id !== filter) return false;
    if (search && !a.target?.toLowerCase().includes(search.toLowerCase()) && !a.action.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ActivityIcon className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold">Atividades</h1>
          <p className="text-muted-foreground text-sm">Histórico completo de ações da equipe</p>
        </div>
      </div>

      {recentDuplicates.size > 0 && (
        <Card className="p-4 bg-warning/10 border-warning/40">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Atenção: produtos analisados por mais de uma pessoa nas últimas 24h</p>
              <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
                {[...recentDuplicates.entries()].slice(0, 5).map(([target]) => (
                  <li key={target}>{target}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Buscar produto ou ação..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os usuários</SelectItem>
            {users.map(u => <SelectItem key={u.user_id} value={u.user_id}>{u.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-gradient-card divide-y divide-border">
        {filtered.length === 0 && <p className="p-6 text-sm text-muted-foreground">Nenhuma atividade encontrada.</p>}
        {filtered.map(a => (
          <div key={a.id} className="p-4 flex items-start gap-3 hover:bg-secondary/30 transition-colors">
            <div className="h-9 w-9 rounded-full bg-primary/10 grid place-items-center text-primary text-xs font-bold flex-shrink-0">
              {a.nome?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{a.nome}</span> {a.action}
                {a.target && <span className="text-primary"> "{a.target}"</span>}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                <span className="text-xs text-muted-foreground">{format(new Date(a.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })}</span>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
