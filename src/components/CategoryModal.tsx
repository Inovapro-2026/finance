import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Save, Trash2, Edit2, Loader2, Utensils, Bus, Gamepad2, FileText, Wallet, ShoppingBag, HeartPulse, Home, PiggyBank, Gift, Car, Plane } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFinance } from '../hooks/useFinance';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

const ICONS = {
  Utensils, Bus, Gamepad2, FileText, Wallet, ShoppingBag, HeartPulse, Home, PiggyBank, Gift, Car, Plane
};

const ICON_OPTIONS = Object.keys(ICONS);
const COLOR_OPTIONS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4'
];

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryModal({ isOpen, onClose }: CategoryModalProps) {
  const { user } = useAuth();
  const { categories, refresh } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    icon: 'ShoppingBag',
    color: '#3b82f6'
  });

  const handleSave = async () => {
    if (!user || !formData.name) return;
    setLoading(true);
    try {
      if (editingId) {
        await supabase.from('categories').update({
          ...formData
        }).eq('id', editingId);
      } else {
        await supabase.from('categories').insert({
          ...formData,
          user_id: user.id,
          created_at: new Date().toISOString()
        });
      }
      resetForm();
      if (refresh) refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta categoria?')) return;
    try {
      await supabase.from('categories').delete().eq('id', id);
      if (refresh) refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (cat: any) => {
    setFormData({
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color
    });
    setEditingId(cat.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'expense', icon: 'ShoppingBag', color: '#3b82f6' });
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#0f1115] border border-slate-800 relative w-full max-w-md rounded-[2.5rem] flex flex-col max-h-[80vh]"
          >
            <div className="p-8 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Categorias</h3>
                  <p className="text-xs text-slate-500 mt-1">Personalize seus gastos e ganhos.</p>
                </div>
                <button onClick={onClose} className="p-2 text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {isAdding ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex gap-2 p-1 bg-slate-900 rounded-2xl">
                    <button 
                      onClick={() => setFormData(d => ({ ...d, type: 'expense' }))}
                      className={cn("flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all", formData.type === 'expense' ? "bg-red-500/20 text-red-500 ring-1 ring-red-500/20" : "text-slate-500")}
                    >Gasto</button>
                    <button 
                      onClick={() => setFormData(d => ({ ...d, type: 'income' }))}
                      className={cn("flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all", formData.type === 'income' ? "bg-green-500/20 text-green-500 ring-1 ring-green-500/20" : "text-slate-500")}
                    >Ganho</button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nome</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-white"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Ícone</label>
                      <div className="grid grid-cols-6 gap-2">
                        {ICON_OPTIONS.map(iconName => {
                          const IconComp = (ICONS as any)[iconName];
                          return (
                            <button 
                              key={iconName}
                              onClick={() => setFormData(d => ({ ...d, icon: iconName }))}
                              className={cn("h-10 rounded-xl flex items-center justify-center transition-all", formData.icon === iconName ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "bg-slate-900 text-slate-500")}
                            >
                              <IconComp size={18} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Cor</label>
                      <div className="flex gap-3">
                        {COLOR_OPTIONS.map(color => (
                          <button 
                            key={color}
                            onClick={() => setFormData(d => ({ ...d, color }))}
                            className={cn("h-8 w-8 rounded-full border-4 transition-all", formData.color === color ? "border-white" : "border-transparent")}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button onClick={resetForm} className="flex-1 py-4 text-xs font-bold text-slate-500">Cancelar</button>
                    <button 
                      onClick={handleSave} 
                      disabled={loading || !formData.name}
                      className="flex-1 bg-blue-600 py-4 rounded-3xl text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      Salvar
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full bg-slate-900 border border-dashed border-slate-800 p-4 rounded-3xl text-slate-500 flex items-center justify-center gap-2 hover:border-blue-500 transition-colors"
                  >
                    <Plus size={18} />
                    Nova Categoria
                  </button>

                  <div className="space-y-2">
                    {categories.length > 0 ? (
                      categories.map(cat => {
                        const IconComp = (ICONS as any)[cat.icon] || ShoppingBag;
                        return (
                          <div key={cat.id} className="bg-white/5 p-4 rounded-3xl flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: cat.color }}>
                                <IconComp size={20} />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white">{cat.name}</h4>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{cat.type === 'income' ? 'Ganho' : 'Gasto'}</p>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEdit(cat)} className="p-2 text-slate-500 hover:text-white"><Edit2 size={16} /></button>
                              <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-sm text-slate-600 italic">Nenhuma categoria personalizada.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
