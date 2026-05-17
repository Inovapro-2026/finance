import { useTime } from '../hooks/useTime';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Circle, Clock, Plus, Target, Zap, Layout } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

export function TimeDashboard() {
  const { tasks, stats, loading, refresh } = useTime();

  const toggleTaskStatus = async (task: any) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await supabase.from('time_tasks').update({ status: newStatus }).eq('id', task.id);
      if (refresh) refresh();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Hoje</h2>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 font-bold text-white shadow-lg shadow-blue-500/20">
          <Zap size={24} />
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-blue-500">
            <Target size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Concluído</span>
          </div>
          <div className="flex items-end gap-2">
            <h4 className="text-4xl font-bold text-white">{stats.completed}</h4>
            <span className="text-[10px] text-slate-500 uppercase font-bold pb-1">tarefas</span>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-cyan-500">
            <Clock size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Pendente</span>
          </div>
          <div className="flex items-end gap-2">
            <h4 className="text-4xl font-bold text-white">{stats.pending}</h4>
            <span className="text-[10px] text-slate-500 uppercase font-bold pb-1">hoje</span>
          </div>
        </div>
      </div>

      {/* Focus Blocks */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-600 p-6 shadow-xl shadow-blue-600/20 border border-white/10 group overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <Clock size={100} />
        </div>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <h3 className="font-bold text-white">Bloco de Foco</h3>
          <span className="text-[10px] bg-white/20 px-2 py-1 rounded-lg font-bold uppercase">Pomodoro</span>
        </div>
        <p className="text-xs text-white/80 mb-6 max-w-[200px] font-medium leading-relaxed relative z-10">Maximize seu desempenho com uma sessão de foco agora.</p>
        <button className="w-full bg-white text-blue-600 py-3.5 rounded-2xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-xl shadow-black/10">
          <Clock size={18} />
          Iniciar Focus Timer
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Suas Tarefas</h3>
          <button className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1">
            <Plus size={14} /> Nova Tarefa
          </button>
        </div>

        <div className="space-y-3">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <motion.div 
                key={task.id}
                layout
                onClick={() => toggleTaskStatus(task)}
                className={cn(
                  "bg-slate-900/40 border border-slate-800 flex items-center gap-4 rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-all",
                  task.status === 'completed' && "opacity-50"
                )}
              >
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all",
                  task.status === 'completed' ? "bg-blue-500 border-blue-500 text-white" : "border-slate-700 bg-slate-900"
                )}>
                  {task.status === 'completed' && <CheckCircle2 size={14} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                  <h4 className={cn("font-bold text-sm text-white", task.status === 'completed' && "line-through opacity-50 font-normal")}>{task.title}</h4>
                  <div className="flex items-center gap-3 mt-1 opacity-60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Clock size={10} />
                      {task.time || 'Sem hora'}
                    </span>
                    {task.is_recurring && <span className="text-[10px] bg-white/5 text-slate-500 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Recorrente</span>}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-700 gap-4 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl">
              <Layout size={48} className="opacity-10" />
              <p className="text-sm font-medium">Nenhuma tarefa agendada para hoje.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
