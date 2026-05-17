import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, X, Check, Save, Loader2 } from 'lucide-react';
import { interpretVoiceCommand } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { formatCurrency, cn } from '../lib/utils';
import { useFinance } from '../hooks/useFinance';
import { useTime } from '../hooks/useTime';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'finance' | 'time';
}

export function VoiceModal({ isOpen, onClose, mode }: VoiceModalProps) {
  const { user } = useAuth();
  const { categories, refresh: refreshFinance } = useFinance() as any;
  const { refresh: refreshTime } = useTime() as any;
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleProcess = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    const catNames = categories?.map((c: any) => c.name);
    const interpreted = await interpretVoiceCommand(text, mode, catNames);
    setResult(interpreted);
    setIsProcessing(false);
  };

  const handleSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      if (mode === 'finance') {
        if (result.type === 'income' || result.type === 'expense') {
          await supabase.from('transactions').insert({
            user_id: user.id,
            type: result.type,
            title: result.title,
            amount: result.amount,
            category: result.category,
            payment_method: result.payment_method || 'debit',
            date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
          });
        } else if (result.type === 'goal') {
          await supabase.from('financial_goals').insert({
            user_id: user.id,
            name: result.title || result.name,
            target_amount: result.amount || result.target_amount,
            current_amount: 0,
            deadline: result.deadline || result.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            created_at: new Date().toISOString()
          });
        } else {
          await supabase.from('future_events').insert({
            user_id: user.id,
            type: result.type.replace('future_', ''),
            title: result.title,
            amount: result.amount,
            is_recurring: result.is_recurring,
            day: result.day || null,
            due_date: result.due_date || null,
            status: 'pending',
            created_at: new Date().toISOString()
          });
        }
        if (refreshFinance) refreshFinance();
      } else {
        await supabase.from('time_tasks').insert({
          user_id: user.id,
          title: result.title,
          description: result.description || '',
          date: result.date || new Date().toISOString().split('T')[0],
          time: result.time || '12:00',
          is_recurring: result.is_recurring || false,
          status: 'pending',
          created_at: new Date().toISOString()
        });
        if (refreshTime) refreshTime();
      }
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setText('');
    setResult(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-6 pb-32">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm"
          >
            <div className="bg-[#0f1115] border border-blue-500/30 rounded-[2.5rem] p-8 shadow-2xl space-y-8 overflow-hidden">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-blue-500/10 blur-3xl rounded-full" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-blue-500">IA Assistente</h3>
                </div>
                <button onClick={handleClose} className="p-1 text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {!result ? (
                <div className="space-y-8 relative z-10">
                  <div className="flex justify-center">
                    <div className="relative">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} 
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-x-[-12px] inset-y-[-12px] rounded-full border border-blue-500/50"
                      />
                      <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                        <Mic size={32} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <p className="text-xs text-slate-400 font-medium">Estou ouvindo...</p>
                      <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter">"Dica: Gastei 25 reais com lanche hoje"</p>
                    </div>
                    
                    <div className="relative">
                      <input 
                        type="text"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Digite ou fale seu comando..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 pr-12 text-sm outline-none focus:border-blue-500 transition-colors"
                        onKeyDown={e => e.key === 'Enter' && handleProcess()}
                      />
                      <button 
                        onClick={handleProcess}
                        disabled={isProcessing || !text}
                        className="absolute right-2 top-2 p-2 text-blue-500 disabled:opacity-30"
                      >
                        {isProcessing ? <Loader2 className="animate-spin" /> : <Check />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8 relative z-10"
                >
                  <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">✨</span>
                      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Interpretação IA</p>
                    </div>
                    
                    <div className="space-y-3">
                      <Field label="Tipo" value={result.type.replace('_', ' ')} />
                      <Field label="Título" value={result.title} />
                      {result.amount && <Field label="Valor" value={formatCurrency(result.amount)} highlight />}
                      {result.date && <Field label="Data/Hora" value={`${result.date} ${result.time || ''}`} />}
                      {result.category && <Field label="Categoria" value={result.category} />}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setResult(null)}
                      className="flex-1 bg-slate-900 border border-slate-800 py-4 rounded-2xl text-xs font-bold text-slate-400 active:scale-95 transition-transform"
                    >
                      Refazer
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 bg-blue-600 py-4 rounded-2xl text-xs font-bold text-white shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      Confirmar
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500 font-medium">{label}:</span>
      <span className={cn("font-bold text-white capitalize", highlight && "text-blue-400 text-lg")}>{value}</span>
    </div>
  );
}
