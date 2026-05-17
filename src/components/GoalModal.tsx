import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFinance } from '../hooks/useFinance';
import { supabase } from '../lib/supabase';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoalModal({ isOpen, onClose }: GoalModalProps) {
  const { user } = useAuth();
  const { refresh } = useFinance();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !name || !targetAmount || !deadline) return;
    setIsSaving(true);
    try {
      await supabase.from('financial_goals').insert({
        user_id: user.id,
        name,
        target_amount: Number(targetAmount),
        current_amount: 0,
        deadline,
        created_at: new Date().toISOString()
      });
      if (refresh) refresh();
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setName('');
    setTargetAmount('');
    setDeadline('');
    onClose();
  };

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
            className="bg-[#0f1115] border border-slate-800 relative w-full max-w-sm rounded-[2.5rem] p-8 space-y-8"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Nova Meta Financeira</h3>
                <button onClick={handleClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Defina seus objetivos e acompanhe o progresso.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nome da Meta</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Viagem para Europa"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-colors text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Valor Alvo</label>
                <input 
                  type="number" 
                  value={targetAmount}
                  onChange={e => setTargetAmount(e.target.value)}
                  placeholder="Ex: 15000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-colors text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Data Desejada</label>
                <input 
                  type="date" 
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-colors text-white"
                />
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving || !name || !targetAmount || !deadline}
              className="w-full bg-blue-600 py-4 rounded-2xl text-xs font-bold text-white shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Target size={18} />}
              Criar Meta
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
