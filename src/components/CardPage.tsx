import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useFinance } from '../hooks/useFinance';
import { supabase } from '../lib/supabase';
import { formatCurrency, generateCardNumber } from '../lib/utils';
import { Plus, CreditCard, ChevronRight, Settings, Info, Loader2 } from 'lucide-react';

export function CardPage() {
  const { profile, user } = useAuth();
  const { cards, transactions, refresh } = useFinance();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({ name: '', limit: 5000, invoiceDay: 10 });

  const activeCard = cards[0];

  const usedLimit = transactions
    .filter(t => t.type === 'expense' && t.payment_method === 'credit' && (!activeCard || t.card_id === activeCard.id))
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const availableLimit = activeCard ? activeCard.credit_limit - usedLimit : 0;
  const progress = activeCard ? (usedLimit / activeCard.credit_limit) * 100 : 0;

  const handleAddCard = async () => {
    if (!user) return;
    setError(null);
    
    // We prefer profile.nome, but if it's missing we can fallback to user.email
    const holderName = profile?.nome || user.email?.split('@')[0] || 'USUÁRIO';

    if (!newCard.name.trim()) {
      setError("Por favor, insira um nome para o cartão.");
      return;
    }

    if (newCard.invoiceDay < 1 || newCard.invoiceDay > 31) {
      setError("O dia de vencimento deve ser entre 1 e 31.");
      return;
    }

    setLoading(true);
    try {
      const { error: insertError } = await supabase.from('cards').insert({
        user_id: user.id,
        card_name: newCard.name,
        card_number_fake: generateCardNumber(),
        card_holder_name: holderName.toUpperCase(),
        credit_limit: newCard.limit,
        available_limit: newCard.limit,
        invoice_day: newCard.invoiceDay,
        closing_day: newCard.invoiceDay - 5 <= 0 ? 30 - (5 - newCard.invoiceDay) : newCard.invoiceDay - 5,
        created_at: new Date().toISOString()
      });
      if (insertError) throw insertError;
      
      setShowAddModal(false);
      setNewCard({ name: '', limit: 5000, invoiceDay: 10 });
      if (refresh) refresh();
    } catch (err: any) {
      console.error("Error adding card:", err);
      setError("Erro ao salvar cartão. Verifique sua conexão ou permissões.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Cartão</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Premium Black Edition</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-blue-500">
          <Plus size={20} />
        </button>
      </header>

      {activeCard ? (
        <div className="space-y-8">
          {/* Refined 3D Card */}
          <div 
            className="perspective-1000 relative h-64 w-full cursor-pointer group" 
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              className="h-full w-full preserve-3d"
            >
              {/* Front */}
              <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-[2.5rem] bg-gradient-to-br from-zinc-800 to-black p-8 shadow-2xl border border-zinc-700 overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-400 via-transparent to-transparent"></div>
                
                <div className="relative z-10 flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="italic font-bold text-xl tracking-widest text-zinc-400">INOVAPRO <span className="text-zinc-600">BLACK</span></div>
                    <p className="text-[8px] uppercase tracking-widest text-zinc-500">International Signature</p>
                  </div>
                  <div className="w-12 h-8 bg-gradient-to-r from-yellow-500/50 to-yellow-200/50 rounded-md border border-yellow-400/30" />
                </div>

                <div className="relative z-10 space-y-4">
                  <p className="font-mono text-2xl tracking-[0.2em] text-white/90">{activeCard.card_number_fake || 'XXXX XXXX XXXX XXXX'}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] uppercase text-zinc-500 tracking-widest mb-0.5">Titular</p>
                      <p className="text-sm font-bold uppercase tracking-widest text-white">{activeCard.card_holder_name}</p>
                    </div>
                    <div className="flex gap-1.5 translate-x-2">
                      <div className="w-10 h-10 rounded-full bg-red-600/80 blur-[0.5px]" />
                      <div className="w-10 h-10 rounded-full bg-yellow-600/80 -ml-5 blur-[0.5px]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Back */}
              <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-[2.5rem] bg-gradient-to-br from-[#000] to-[#1a1a1a] py-8 rotate-y-180 border border-slate-800">
                <div className="h-12 w-full bg-black" />
                <div className="px-8">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-48 bg-slate-300 italic text-slate-900 flex items-center justify-end px-4 text-sm font-black tracking-widest">
                      {Math.floor(100 + Math.random() * 899)}
                    </div>
                    <div className="text-[8px] text-zinc-600 uppercase leading-tight font-bold">Signiture not valid<br/>unless signed</div>
                  </div>
                </div>
                <div className="px-8 text-[8px] text-zinc-700 leading-tight uppercase font-medium">
                  This card is property of INOVAPRO Finance. Use is subject to terms and conditions. If found, please return to any branch or report via app.
                </div>
              </div>
            </motion.div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-zinc-600 uppercase font-bold tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Toque para girar</div>
          </div>

          {/* Limits Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-white font-semibold">Gestão do Cartão</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs tracking-tight">
                <span className="text-slate-400 font-medium">Limite Utilizado</span>
                <span className="text-slate-200 font-bold">{formatCurrency(usedLimit)} / {formatCurrency(activeCard.credit_limit)}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden ring-1 ring-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest pt-1">
                <span>Disponível: {formatCurrency(availableLimit)}</span>
                <span>Fatura em dia</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all active:scale-95">
                Aumentar Limite
              </button>
              <button className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all active:scale-95">
                Alterar Vencimento
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-6">
          <div className="relative">
            <div className="h-20 w-32 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-600">
              <CreditCard size={48} />
            </div>
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">!</div>
          </div>
          <div>
            <h3 className="font-bold text-white">Nenhum cartão ativo</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">Adicione seu primeiro cartão premium INOVAPRO para começar.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 px-8 py-3 rounded-2xl text-xs font-bold text-white shadow-lg shadow-blue-600/20 active:scale-95 transition-transform"
          >
            Adicionar Agora
          </button>
        </div>
      )}

      {/* Simplified Add Card Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0f1115] border border-slate-800 relative w-full max-w-sm rounded-[2.5rem] p-8 space-y-8"
            >
              <div>
                <h3 className="text-xl font-bold text-white">Novo Cartão Black</h3>
                <p className="text-xs text-slate-500 mt-1">Insira os detalhes para emissão digital.</p>
              </div>

              <div className="space-y-5">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold text-center uppercase tracking-wider">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nome de Exibição</label>
                  <input 
                    type="text" 
                    value={newCard.name}
                    onChange={e => setNewCard({...newCard, name: e.target.value})}
                    placeholder="Ex: Santander Unlimited"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Limite</label>
                    <input 
                      type="number" 
                      value={newCard.limit}
                      onChange={e => setNewCard({...newCard, limit: Number(e.target.value)})}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Vencimento</label>
                    <input 
                      type="number" 
                      min="1" max="31"
                      value={newCard.invoiceDay}
                      onChange={e => setNewCard({...newCard, invoiceDay: Number(e.target.value)})}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-900 border border-slate-800 py-4 rounded-2xl text-xs font-bold text-slate-400 active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddCard}
                  disabled={loading || !newCard.name}
                  className="flex-1 bg-blue-600 py-4 rounded-2xl text-xs font-bold text-white shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
