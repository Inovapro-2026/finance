import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, ShieldCheck, ChevronRight, ChevronLeft, CreditCard, Wallet, Calendar, User, Mail, Lock, Volume2 } from 'lucide-react';
import { speak } from '../services/voice';
import { useEffect } from 'react';

type Step = 'login' | 'nome' | 'sobrenome' | 'email' | 'password' | 'cartao' | 'saldo' | 'valor_pagamento' | 'dia_pagamento' | 'tem_adiantamento' | 'valor_adiantamento' | 'dia_adiantamento';

const steps: Step[] = ['nome', 'sobrenome', 'email', 'password', 'cartao', 'saldo', 'valor_pagamento', 'dia_pagamento', 'tem_adiantamento', 'valor_adiantamento', 'dia_adiantamento'];

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [temCartao, setTemCartao] = useState<boolean | null>(null);
  const [saldoAtual, setSaldoAtual] = useState('');
  const [valorPagamento, setValorPagamento] = useState('');
  const [diaPagamento, setDiaPagamento] = useState('');
  const [temAdiantamento, setTemAdiantamento] = useState<boolean | null>(null);
  const [valorAdiantamento, setValorAdiantamento] = useState('');
  const [diaAdiantamento, setDiaAdiantamento] = useState('');

  useEffect(() => {
    if (!isLogin) {
      const step = steps[currentStep];
      const questions: Record<string, string> = {
        nome: 'Qual o seu primeiro nome?',
        sobrenome: 'E o seu sobrenome?',
        email: 'Qual o seu melhor e-mail?',
        password: 'Crie uma senha segura com pelo menos seis caracteres.',
        cartao: 'Você possui cartão de crédito?',
        saldo: 'Qual o seu saldo atual em conta?',
        valor_pagamento: 'Qual o valor do seu pagamento principal?',
        dia_pagamento: 'Em qual dia do mês você recebe seu pagamento?',
        tem_adiantamento: 'Você recebe adiantamento?',
        valor_adiantamento: 'Qual o valor do seu adiantamento?',
        dia_adiantamento: 'Qual o dia do seu adiantamento?'
      };
      
      const text = questions[step];
      if (text) {
        speak(text);
      }
    }
  }, [currentStep, isLogin]);

  const nextStep = () => {
    const step = steps[currentStep];
    if (step === 'nome' && !nome) return;
    if (step === 'sobrenome' && !sobrenome) return;
    if (step === 'email' && !email) return;
    if (step === 'password' && password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (step === 'tem_adiantamento' && temAdiantamento === false) {
      handleSignUp();
      return;
    }
    
    setError(null);
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSignUp();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      if (steps[currentStep] === 'valor_adiantamento' && temAdiantamento === false) {
          // This shouldn't happen due to skip logic, but just in case
      }
      setCurrentStep(prev => prev - 1);
      setError(null);
    } else {
      setIsLogin(true);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      const parseValue = (val: string) => parseFloat(val.replace(',', '.')) || 0;
      const parseDay = (val: string) => parseInt(val) || 1;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            sobrenome,
            tem_cartao: temCartao,
            saldo_atual: parseValue(saldoAtual),
            valor_pagamento: parseValue(valorPagamento),
            dia_pagamento: parseDay(diaPagamento),
            valor_adiantamento: temAdiantamento ? parseValue(valorAdiantamento) : 0,
            dia_adiantamento: temAdiantamento ? parseDay(diaAdiantamento) : null
          },
          emailRedirectTo: window.location.origin
        }
      });
      if (signUpError) throw signUpError;
      
      if (data.user && !data.session) {
        setError('Conta criada! Por favor, verifique seu e-mail para confirmar o cadastro.');
      }
    } catch (err: any) {
      console.error("Auth error details:", err);
      const msg = err?.message || err?.error_description || String(err);
      setError(msg.includes('already registered') ? 'Este e-mail já está cadastrado.' : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    } catch (err: any) {
      setError('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    const step = steps[currentStep];
    
    switch (step) {
      case 'nome':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary mb-2">
              <User size={24} />
              <h2 className="text-xl font-semibold text-white">Qual o seu primeiro nome?</h2>
            </div>
            <input
              autoFocus
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-2xl bg-white/5 px-6 py-4 text-xl text-white outline-none ring-1 ring-white/10 focus:ring-brand-primary transition-all"
              placeholder="Ex: João"
              onKeyDown={(e) => e.key === 'Enter' && nextStep()}
            />
          </div>
        );
      case 'sobrenome':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary mb-2">
              <User size={24} />
              <h2 className="text-xl font-semibold text-white">E o seu sobrenome?</h2>
            </div>
            <input
              autoFocus
              type="text"
              value={sobrenome}
              onChange={(e) => setSobrenome(e.target.value)}
              className="w-full rounded-2xl bg-white/5 px-6 py-4 text-xl text-white outline-none ring-1 ring-white/10 focus:ring-brand-primary transition-all"
              placeholder="Ex: Silva"
              onKeyDown={(e) => e.key === 'Enter' && nextStep()}
            />
          </div>
        );
      case 'email':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary mb-2">
              <Mail size={24} />
              <h2 className="text-xl font-semibold text-white">Qual o seu melhor e-mail?</h2>
            </div>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl bg-white/5 px-6 py-4 text-xl text-white outline-none ring-1 ring-white/10 focus:ring-brand-primary transition-all"
              placeholder="seu@email.com"
              onKeyDown={(e) => e.key === 'Enter' && nextStep()}
            />
          </div>
        );
      case 'password':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary mb-2">
              <Lock size={24} />
              <h2 className="text-xl font-semibold text-white">Crie uma senha segura</h2>
            </div>
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl bg-white/5 px-6 py-4 text-xl text-white outline-none ring-1 ring-white/10 focus:ring-brand-primary transition-all"
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && nextStep()}
            />
            <p className="text-xs text-gray-500">Mínimo de 6 caracteres.</p>
          </div>
        );
      case 'cartao':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary mb-2">
              <CreditCard size={24} />
              <h2 className="text-xl font-semibold text-white">Você possui cartão de crédito?</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setTemCartao(true); nextStep(); }}
                className={`rounded-2xl p-6 text-lg font-bold border-2 transition-all ${temCartao === true ? 'border-brand-primary bg-brand-primary/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
              >
                Sim
              </button>
              <button
                onClick={() => { setTemCartao(false); nextStep(); }}
                className={`rounded-2xl p-6 text-lg font-bold border-2 transition-all ${temCartao === false ? 'border-brand-primary bg-brand-primary/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
              >
                Não
              </button>
            </div>
          </div>
        );
      case 'saldo':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary mb-2">
              <Wallet size={24} />
              <h2 className="text-xl font-semibold text-white">Qual seu saldo atual em conta?</h2>
            </div>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl text-gray-500">R$</span>
              <input
                autoFocus
                type="number"
                value={saldoAtual}
                onChange={(e) => setSaldoAtual(e.target.value)}
                className="w-full rounded-2xl bg-white/5 pl-16 pr-6 py-4 text-xl text-white outline-none ring-1 ring-white/10 focus:ring-brand-primary transition-all"
                placeholder="0,00"
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
              />
            </div>
          </div>
        );
      case 'valor_pagamento':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary mb-2">
              <Wallet size={24} />
              <h2 className="text-xl font-semibold text-white">Valor do seu pagamento principal</h2>
            </div>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl text-gray-500">R$</span>
              <input
                autoFocus
                type="number"
                value={valorPagamento}
                onChange={(e) => setValorPagamento(e.target.value)}
                className="w-full rounded-2xl bg-white/5 pl-16 pr-6 py-4 text-xl text-white outline-none ring-1 ring-white/10 focus:ring-brand-primary transition-all"
                placeholder="0,00"
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
              />
            </div>
          </div>
        );
      case 'dia_pagamento':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary mb-2">
              <Calendar size={24} />
              <h2 className="text-xl font-semibold text-white">Dia do pagamento principal</h2>
            </div>
            <input
              autoFocus
              type="number"
              min="1"
              max="31"
              value={diaPagamento}
              onChange={(e) => setDiaPagamento(e.target.value)}
              className="w-full rounded-2xl bg-white/5 px-6 py-4 text-xl text-white outline-none ring-1 ring-white/10 focus:ring-brand-primary transition-all"
              placeholder="Ex: 5"
              onKeyDown={(e) => e.key === 'Enter' && nextStep()}
            />
          </div>
        );
      case 'tem_adiantamento':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary mb-2">
              <Wallet size={24} />
              <h2 className="text-xl font-semibold text-white">Você recebe adiantamento?</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setTemAdiantamento(true); setCurrentStep(prev => prev + 1); }}
                className={`rounded-2xl p-6 text-lg font-bold border-2 transition-all ${temAdiantamento === true ? 'border-brand-primary bg-brand-primary/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
              >
                Sim
              </button>
              <button
                onClick={() => { setTemAdiantamento(false); handleSignUp(); }}
                className={`rounded-2xl p-6 text-lg font-bold border-2 transition-all ${temAdiantamento === false ? 'border-brand-primary bg-brand-primary/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
              >
                Não
              </button>
            </div>
          </div>
        );
      case 'valor_adiantamento':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary mb-2">
              <Wallet size={24} />
              <h2 className="text-xl font-semibold text-white">Valor do seu adiantamento</h2>
            </div>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl text-gray-500">R$</span>
              <input
                autoFocus
                type="number"
                value={valorAdiantamento}
                onChange={(e) => setValorAdiantamento(e.target.value)}
                className="w-full rounded-2xl bg-white/5 pl-16 pr-6 py-4 text-xl text-white outline-none ring-1 ring-white/10 focus:ring-brand-primary transition-all"
                placeholder="0,00"
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
              />
            </div>
          </div>
        );
      case 'dia_adiantamento':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary mb-2">
              <Calendar size={24} />
              <h2 className="text-xl font-semibold text-white">Dia do adiantamento</h2>
            </div>
            <input
              autoFocus
              type="number"
              min="1"
              max="31"
              value={diaAdiantamento}
              onChange={(e) => setDiaAdiantamento(e.target.value)}
              className="w-full rounded-2xl bg-white/5 px-6 py-4 text-xl text-white outline-none ring-1 ring-white/10 focus:ring-brand-primary transition-all"
              placeholder="Ex: 20"
              onKeyDown={(e) => e.key === 'Enter' && nextStep()}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (isLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-2xl shadow-blue-500/20">
              <ShieldCheck size={40} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white italic">INOVAPRO</h1>
            <p className="mt-2 text-slate-500 font-medium">Gestão Inteligente de Finanças & Tempo</p>
          </div>

          <div className="glass rounded-[2.5rem] p-8 border border-white/5">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 px-5 py-4 text-white outline-none ring-1 ring-white/10 focus:ring-blue-500 transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 px-5 py-4 text-white outline-none ring-1 ring-white/10 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <p className="text-sm text-rose-500 font-medium px-1">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-blue-600/20"
              >
                {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><LogIn size={20} /> Entrar</>}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button onClick={() => setIsLogin(false)} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                Novo por aqui? <span className="text-blue-400">Crie sua conta premium</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] p-6 overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-lg">
        <div className="mb-12 flex items-center justify-between px-2">
          <button onClick={prevStep} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= currentStep ? 'w-6 bg-blue-500' : 'w-1.5 bg-white/10'}`} />
            ))}
          </div>
          <div className="w-12" />
        </div>

        <div className="relative min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full"
            >
              <div className="glass rounded-[3rem] p-10 border border-white/5 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5">
                    <ShieldCheck size={120} />
                 </div>
                
                {renderStep()}

                {error && <p className="mt-4 text-sm text-rose-500 font-medium">{error}</p>}

                <div className="mt-10">
                  <button
                    onClick={nextStep}
                    disabled={loading || (() => {
                      const step = steps[currentStep];
                      if (step === 'nome') return !nome;
                      if (step === 'sobrenome') return !sobrenome;
                      if (step === 'email') return !email;
                      if (step === 'password') return password.length < 6;
                      if (step === 'cartao') return temCartao === null;
                      if (step === 'saldo') return saldoAtual === '';
                      if (step === 'valor_pagamento') return valorPagamento === '';
                      if (step === 'dia_pagamento') return diaPagamento === '';
                      if (step === 'tem_adiantamento') return temAdiantamento === null;
                      if (step === 'valor_adiantamento') return valorAdiantamento === '';
                      if (step === 'dia_adiantamento') return diaAdiantamento === '';
                      return false;
                    })()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-5 text-lg font-bold text-white transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl shadow-blue-600/30"
                  >
                    {loading ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        {currentStep === steps.length - 1 ? 'Finalizar Cadastro' : 'Continuar'}
                        <ChevronRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <p className="mt-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
           Passo {currentStep + 1} de {steps.length} • Inovapro Onboarding
        </p>
      </motion.div>
    </div>
  );
}
