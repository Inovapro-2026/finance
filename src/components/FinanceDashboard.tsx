import { useState } from 'react';
import { motion } from 'motion/react';
import { useFinance } from '../hooks/useFinance';
import { formatCurrency, cn } from '../lib/utils';
import { ArrowUpRight, ArrowDownRight, Wallet, CalendarDays, TrendingUp, TrendingDown, Target, Plus, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { GoalModal } from './GoalModal';
import { TransactionModal } from './TransactionModal';

export function FinanceDashboard() {
  const { transactions, goals, totals, leftAtMonthEnd, loading } = useFinance();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  if (loading) return null;

  const chartData = [
    { name: 'Ganhos', value: totals.incomeMonth, color: '#10b981' },
    { name: 'Gastos', value: totals.expenseMonth, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Finanças</h2>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Painel de Controle</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsTransactionModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} /> Nova
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Online
          </div>
        </div>
      </header>

      {/* Main Balance Card */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-[#0f1115] p-8 border border-slate-800 shadow-xl"
      >
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">Saldo Total Disponível</p>
          <h3 className="text-4xl font-bold text-white tracking-tight">{formatCurrency(totals.currentBalance)}</h3>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <ArrowUpRight size={12} />
              <span>Ganhos</span>
            </div>
            <p className="text-lg font-bold text-white">{formatCurrency(totals.incomeMonth)}</p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1">
              <ArrowDownRight size={12} />
              <span>Gastos</span>
            </div>
            <p className="text-lg font-bold text-white">{formatCurrency(totals.expenseMonth)}</p>
          </div>
        </div>
      </motion.div>

      {/* Goals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Suas Metas</h3>
          <button 
            onClick={() => setIsGoalModalOpen(true)}
            className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1"
          >
            <Plus size={14} /> Nova Meta
          </button>
        </div>
        
        <div className="space-y-4">
          {goals.length > 0 ? (
            goals.map(goal => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const remaining = goal.target_amount - goal.current_amount;
              
              return (
                <div key={goal.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Target size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{goal.name}</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Até {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{formatCurrency(goal.current_amount)}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">de {formatCurrency(goal.target_amount)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden ring-1 ring-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                      <span>{progress.toFixed(0)}% Concluído</span>
                      <span>Faltam {formatCurrency(remaining)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-600 text-sm italic bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
              Nenhuma meta cadastrada. Defina seu primeiro objetivo!
            </div>
          )}
        </div>
      </div>

      <GoalModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} />
      <TransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} />

      {/* AI Insight Card */}
      <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-600/20 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <TrendingUp size={80} />
        </div>
        <div className="flex items-center gap-3 mb-2 relative z-10">
          <span className="text-xl">📊</span>
          <h3 className="font-bold">Insights IA</h3>
        </div>
        <p className="text-xs leading-relaxed opacity-90 italic relative z-10">
          "Você economizou 12% a mais do que o mês passado na categoria Lanches. Continue assim para atingir sua meta rapidamente!"
        </p>
      </div>

      {/* Forecast & Future Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400">
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Ganhos Futuros</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totals.futureIncome)}</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400">
              <CalendarDays size={18} />
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Gastos Futuros</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totals.futureExpense)}</p>
          </div>
        </div>
      </div>

      {/* Remaining Forecast */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quanto vai sobrar?</p>
          <h4 className="text-2xl font-bold text-white">{formatCurrency(leftAtMonthEnd)}</h4>
          <p className="text-[10px] text-slate-600">Estimativa para o fim do mês</p>
        </div>
        <div className="h-16 w-16 relative">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="176" strokeDashoffset={176 - (176 * 0.68)} className="text-blue-500" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-blue-400">68%</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Próximos Gastos</h3>
          <button className="text-[10px] font-bold text-blue-500 uppercase">Ver tudo</button>
        </div>
        <div className="space-y-3">
          {transactions.slice(0, 4).map(t => (
            <motion.div 
              key={t.id}
              whileTap={{ scale: 0.98 }}
              className="bg-slate-900/40 border border-slate-800 flex items-center justify-between rounded-2xl p-4"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  t.type === 'income' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                )}>
                  {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{t.title}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{t.category} • {new Date(t.date).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <p className={cn(
                "text-sm font-bold",
                t.type === 'income' ? "text-emerald-400" : "text-white"
              )}>
                {t.type === 'income' ? '+' : ''}{formatCurrency(t.amount)}
              </p>
            </motion.div>
          ))}
          {transactions.length === 0 && (
            <div className="py-8 text-center text-slate-600 text-sm italic">Nenhuma transação registrada.</div>
          )}
        </div>
      </div>
    </div>
  );
}
