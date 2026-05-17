import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Loader2, Landmark, CreditCard, Banknote, Coins } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFinance } from '../hooks/useFinance';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { speak } from '../services/voice';
import { useEffect } from 'react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const { user } = useAuth();
  const { categories, cards, refresh } = useFinance();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    payment_method: 'pix' as 'pix' | 'credit' | 'debit' | 'cash',
    card_id: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) {
      speak('Nova Transação');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!user || !formData.title || !formData.amount || !formData.category) return;
    setLoading(true);
    try {
      await supabase.from('transactions').insert({
        ...formData,
        user_id: user.id,
        amount: Number(formData.amount),
        created_at: new Date().toISOString()
      });
      if (refresh) refresh();
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      amount: '',
      type: 'expense',
      category: '',
      payment_method: 'pix',
      card_id: '',
      date: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#0f1115] border border-slate-800 relative w-full max-w-md rounded-[2.5rem] flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Nova Transação</h3>
                <button onClick={handleClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="flex gap-2 p-1 bg-slate-900 rounded-2xl">
                <button 
                  onClick={() => { setFormData(d => ({ ...d, type: 'expense' })); speak('Registrar Gasto'); }}
                  className={cn("flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all", formData.type === 'expense' ? "bg-rose-500/20 text-rose-500 ring-1 ring-rose-500/20" : "text-slate-500")}
                >Gasto</button>
                <button 
                  onClick={() => { setFormData(d => ({ ...d, type: 'income' })); speak('Registrar Ganho'); }}
                  className={cn("flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all", formData.type === 'income' ? "bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500/20" : "text-slate-500")}
                >Ganho</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Título</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Aluguel"
                    value={formData.title}
                    onChange={e => setFormData(d => ({ ...d, title: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Valor</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData(d => ({ ...d, amount: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Categoria</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData(d => ({ ...d, category: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-white appearance-none"
                >
                  <option value="">Selecione...</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Pagamento</label>
                  <select 
                    value={formData.payment_method}
                    onChange={e => setFormData(d => ({ ...d, payment_method: e.target.value as any }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-white appearance-none"
                  >
                    <option value="pix">PIX</option>
                    <option value="credit">Crédito</option>
                    <option value="debit">Débito</option>
                    <option value="cash">Dinheiro</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Data</label>
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData(d => ({ ...d, date: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-white"
                  />
                </div>
              </div>

              {formData.payment_method === 'credit' && cards.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Cartão</label>
                  <select 
                    value={formData.card_id}
                    onChange={e => setFormData(d => ({ ...d, card_id: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-white appearance-none"
                  >
                    <option value="">Selecione o cartão...</option>
                    {cards.map(card => (
                      <option key={card.id} value={card.id}>{card.card_name} (Final {card.card_number_fake.slice(-4)})</option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                onClick={handleSave}
                disabled={loading || !formData.title || !formData.amount || !formData.category}
                className="w-full bg-blue-600 py-4 rounded-3xl text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Salvar Transação
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
