import { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { formatCurrency, cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CreditCard, Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function AnalysisPage() {
  const { transactions, totals, leftAtMonthEnd, loading } = useFinance();

  const [viewType, setViewType] = useState<'income' | 'expense'>('expense');

  if (loading) return null;

  const chartData = [
    { name: 'Ganhos', value: Number(totals.incomeMonth), color: '#10b981' },
    { name: 'Gastos', value: Number(totals.expenseMonth), color: '#f43f5e' },
  ];

  const filteredTransactions = transactions.filter(t => t.type === viewType);
  
  const groupedByCategory = filteredTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.entries(groupedByCategory)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value);

  const CATEGORY_COLORS = ['#3b82f6', '#06b6d4', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Análise</h2>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Resumo Mensal de Maio</p>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setViewType('expense')}
            className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", viewType === 'expense' ? "bg-rose-500/20 text-rose-500" : "text-slate-500")}
          >Gastos</button>
          <button 
            onClick={() => setViewType('income')}
            className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", viewType === 'income' ? "bg-emerald-500/20 text-emerald-500" : "text-slate-500")}
          >Ganhos</button>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          label="Total Gasto" 
          value={formatCurrency(totals.expenseMonth)} 
          icon={<ArrowDownRight size={14} />} 
          color="text-rose-400"
          bgColor="bg-rose-500/10"
        />
        <StatCard 
          label="Sobra Prevista" 
          value={formatCurrency(leftAtMonthEnd)} 
          icon={<ArrowUpRight size={14} />} 
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
        />
      </div>

      {/* Main Chart Card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Comparativo Mensal</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                labelClassName="font-bold text-slate-400"
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Categories Breakdown */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Maiores {viewType === 'expense' ? 'Gastos' : 'Ganhos'}</h3>
          <span className={cn("text-[10px] px-2 py-1 rounded-lg font-bold uppercase", viewType === 'expense' ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400")}>Maio</span>
        </div>

        <div className="space-y-6">
          {categoryData.slice(0, 5).map((cat, i) => (
            <div key={cat.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  <span className="text-sm font-bold text-white">{cat.name}</span>
                </div>
                <span className="text-sm font-bold text-white">{formatCurrency(cat.value)}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(Number(cat.value) / (Number(viewType === 'expense' ? totals.expenseMonth : totals.incomeMonth) || 1)) * 100}%` }}
                   className="h-full rounded-full"
                   style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                />
              </div>
            </div>
          ))}
          {categoryData.length === 0 && (
            <div className="py-8 text-center text-slate-600 text-sm italic">Nenhum {viewType === 'expense' ? 'gasto' : 'ganho'} categorizado este mês.</div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-2 gap-4">
        <MethodCard label="Crédito" icon={<CreditCard size={18} />} color="text-blue-400" />
        <MethodCard label="Débito" icon={<Wallet size={18} />} color="text-cyan-400" />
      </div>

      {/* Insight Footer */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-start gap-4">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
          <TrendingUp size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-400">Excelente progresso!</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">Você reduziu seus gastos fixos em 8% este mês. Isso representa uma economia anual projetada de R$ 3.200,00.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, bgColor }: { label: string, value: string, icon: any, color: string, bgColor: string }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5">
      <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-3", bgColor, color)}>
        {icon} {label}
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function MethodCard({ label, icon, color }: { label: string, icon: any, color: string }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4">
      <div className={cn("h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800", color)}>
        {icon}
      </div>
      <p className="text-sm font-bold text-white">{label}</p>
    </div>
  );
}

