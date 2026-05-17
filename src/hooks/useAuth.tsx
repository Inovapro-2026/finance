import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(currentUser: User) {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
        
      if (error && error.code === 'PGRST116') {
        // Not found, try to create default based on user metadata
        const newProfile = {
          user_id: currentUser.id,
          nome: currentUser.user_metadata?.nome || currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuário',
          sobrenome: currentUser.user_metadata?.sobrenome || '',
          email: currentUser.email,
          tem_cartao: currentUser.user_metadata?.tem_cartao || false,
          saldo_atual: currentUser.user_metadata?.saldo_atual || 0,
          salario: (currentUser.user_metadata?.valor_pagamento || 0) + (currentUser.user_metadata?.valor_adiantamento || 0),
          valor_pagamento: currentUser.user_metadata?.valor_pagamento || 0,
          dia_pagamento: currentUser.user_metadata?.dia_pagamento || 1,
          valor_adiantamento: currentUser.user_metadata?.valor_adiantamento || 0,
          dia_adiantamento: currentUser.user_metadata?.dia_adiantamento || null,
          created_at: new Date().toISOString()
        };
        const { data: createdData } = await supabase
          .from('users_profile')
          .insert([newProfile])
          .select()
          .single();
          
        setProfile(createdData as UserProfile);
      } else if (data) {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile() {
    if (!user) return;
    await fetchProfile(user);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
