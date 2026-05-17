import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Home, CreditCard, Mic, BarChart3, User, Calendar, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { VoiceModal } from './VoiceModal';
import type { AppMode, ActiveTab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export function Layout({ children, mode, onModeChange, activeTab, onTabChange }: LayoutProps) {
  const [isMicOpen, setIsMicOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0b] text-slate-200">
      {/* Top Header / Mode Toggle */}
      <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-slate-800 bg-[#0f1115]/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 font-bold text-white shadow-lg shadow-blue-500/20">
            I
          </div>
          <span className="text-xl font-bold tracking-tight text-white">INOVAPRO</span>
        </div>
        
        <div className="relative flex rounded-full border border-slate-800 bg-slate-900 p-1">
          <button
            onClick={() => onModeChange('finance')}
            className={cn(
              "relative z-10 flex items-center gap-2 rounded-full px-5 py-1.5 text-xs font-semibold transition-all",
              mode === 'finance' ? "text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
            Finanças
          </button>
          <button
            onClick={() => onModeChange('time')}
            className={cn(
              "relative z-10 flex items-center gap-2 rounded-full px-5 py-1.5 text-xs font-semibold transition-all",
              mode === 'time' ? "text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
            Tempo
          </button>
          <motion.div
            layoutId="mode-bg"
            className="absolute inset-y-1 left-1 rounded-full bg-blue-600 shadow-lg shadow-blue-600/20"
            initial={false}
            animate={{
              x: mode === 'finance' ? 0 : '100%',
              width: '50%',
            }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-32">
        <motion.div
          key={`${mode}-${activeTab}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="container mx-auto max-w-lg p-6 lg:max-w-4xl lg:px-12"
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-[#0f1115] px-6 h-24 flex items-center justify-center">
        <div className="flex w-full max-w-sm items-center justify-around relative">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => onTabChange('dashboard')} 
            icon={mode === 'finance' ? Home : Calendar} 
            label="Dashboard"
          />
          <NavButton 
            active={activeTab === 'card'} 
            onClick={() => onTabChange('card')} 
            icon={CreditCard} 
            label="Cartão"
          />
          
          {/* Main Voice Button */}
          <div className="relative -top-10">
            <div className="p-1 bg-[#0a0a0b] rounded-full">
              <button
                onClick={() => setIsMicOpen(true)}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0_0_40px_rgba(37,99,235,0.4)] border-4 border-[#0f1115] transition-transform hover:scale-105 active:scale-95"
              >
                <Mic size={28} />
              </button>
            </div>
          </div>

          <NavButton 
            active={activeTab === 'analysis'} 
            onClick={() => onTabChange('analysis')} 
            icon={BarChart3} 
            label="Análise"
          />
          <NavButton 
            active={activeTab === 'profile'} 
            onClick={() => onTabChange('profile')} 
            icon={User} 
            label="Perfil"
          />
        </div>
      </footer>

      <VoiceModal isOpen={isMicOpen} onClose={() => setIsMicOpen(false)} mode={mode} />
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all active:scale-90",
        active ? "text-blue-500" : "text-slate-500 hover:text-slate-300"
      )}
    >
      <Icon size={22} strokeWidth={2.5} />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      {active && (
        <motion.div
          layoutId="nav-glow"
          className="absolute -bottom-2 h-1 w-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
        />
      )}
    </button>
  );
}
