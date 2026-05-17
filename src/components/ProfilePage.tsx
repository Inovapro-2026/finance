import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFinance } from '../hooks/useFinance';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { User, Mail, Phone, LogOut, ChevronRight, Bell, Shield, CreditCard, Layers, Wallet, Calendar } from 'lucide-react';
import { CategoryModal } from './CategoryModal';

export function ProfilePage() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { cards, categories } = useFinance();
  const [isEditing, setIsEditing] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: profile?.nome || '',
    telefone: profile?.telefone || ''
  });

  const handleUpdate = async () => {
    if (!profile) return;
    try {
      await supabase.from('users_profile').update({
        nome: formData.nome,
        telefone: formData.telefone
      }).eq('id', profile.id);
      setIsEditing(false);
      refreshProfile();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-col items-center justify-center py-8">
        <div className="relative">
          <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-4xl font-bold text-white ring-4 ring-[#0a0a0b] shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-black/10" />
            <span className="relative z-10">{profile?.nome?.[0] || 'U'}</span>
          </div>
          <div className="absolute bottom-1.5 right-1.5 h-7 w-7 rounded-full bg-emerald-500 ring-4 ring-[#0a0a0b] border border-white/20" />
        </div>
        <div className="mt-6 text-center space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">{profile?.nome || 'Usuário'}</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{profile?.email}</p>
        </div>
      </header>

      <div className="space-y-6">
        {/* Settings Groups */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-4 divide-y divide-slate-800">
          <div className="py-4 px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-5 px-2">Conta Premium</h3>
            <div className="space-y-4">
              <ProfileItem icon={<User size={18} />} label="Nome Completo" value={`${profile?.nome} ${profile?.sobrenome || ''}`} />
              <ProfileItem icon={<Mail size={18} />} label="E-mail Principal" value={profile?.email || 'N/A'} />
              <ProfileItem icon={<Wallet size={18} />} label="Saldo Atual" value={profile?.saldo_atual ? `R$ ${profile.saldo_atual.toLocaleString('pt-BR')}` : 'R$ 0,00'} />
              <ProfileItem icon={<Wallet size={18} />} label="Pagamento Principal" value={profile?.valor_pagamento ? `R$ ${profile.valor_pagamento.toLocaleString('pt-BR')} (Dia ${profile.dia_pagamento})` : 'Não informado'} />
              {profile?.valor_adiantamento ? (
                <ProfileItem icon={<Calendar size={18} />} label="Adiantamento" value={`R$ ${profile.valor_adiantamento.toLocaleString('pt-BR')} (Dia ${profile.dia_adiantamento})`} />
              ) : null}
            </div>
          </div>
          
          <div className="py-4 px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-5 px-2">Financeiro</h3>
            <div className="space-y-4">
              <ProfileItem 
                icon={<CreditCard size={18} />} 
                label="Cartões Black Ativos" 
                value={`${cards.length} Platinum Edition`} 
              />
              <div onClick={() => setIsCategoryModalOpen(true)}>
                <ProfileItem icon={<Layers size={18} />} label="Categorias de Gastos" value={`${categories.length} Personalizadas`} />
              </div>
            </div>
          </div>

          <div className="py-4 px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-5 px-2">Configurações</h3>
            <div className="space-y-4">
              <ProfileItem icon={<Bell size={18} />} label="Push Notifications" value="Ativadas" />
              <ProfileItem icon={<Shield size={18} />} label="Segurança & Biometria" value="Ativo" />
            </div>
          </div>
        </div>

        <button 
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 py-5 rounded-[2rem] text-sm font-bold active:scale-[0.98] transition-all"
        >
          <LogOut size={20} />
          Sair do INOVAPRO
        </button>
      </div>

      <div className="pt-4 text-center space-y-2">
        <p className="text-[10px] text-slate-700 uppercase font-black tracking-[0.3em]">
          PRIVACY • SECURITY • PRECISION
        </p>
        <p className="text-[8px] text-slate-800 uppercase font-bold">
          Version 2.4.0 (2026) Build 882
        </p>
      </div>

      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
    </div>
  );
}

function ProfileItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between group cursor-pointer active:opacity-60 transition-all p-2 rounded-2xl hover:bg-white/5">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
          {icon}
        </div>
        <div>
          <p className="text-[9px] uppercase text-slate-500 font-bold tracking-tighter mb-0.5">{label}</p>
          <p className="font-bold text-sm text-slate-200">{value}</p>
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
    </div>
  );
}
