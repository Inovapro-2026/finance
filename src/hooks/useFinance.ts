import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Transaction, FutureEvent, Card, FinancialGoal, Category } from '../types';

export function useFinance() {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [futureEvents, setFutureEvents] = useState<FutureEvent[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [localProfile, setLocalProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [
        { data: transactionsData },
        { data: cardsData },
        { data: futureData },
        { data: goalsData },
        { data: categoriesData },
        { data: profileData }
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('cards').select('*').eq('user_id', user.id),
        supabase.from('future_events').select('*').eq('user_id', user.id),
        supabase.from('financial_goals').select('*').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('users_profile').select('*').eq('user_id', user.id).single()
      ]);

      setTransactions(transactionsData as Transaction[] || []);
      setCards(cardsData as Card[] || []);
      setFutureEvents(futureData as FutureEvent[] || []);
      setGoals(goalsData as FinancialGoal[] || []);
      setCategories(categoriesData as Category[] || []);
      // Local profile state to ensure totals are calculated with fresh data
      setLocalProfile(profileData as any);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setFutureEvents([]);
      setCards([]);
      setGoals([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    fetchData();

    const channel = supabase.channel(`finance_changes_${Date.now()}_${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards', filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'future_events', filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'financial_goals', filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  const totals = {
    incomeMonth: transactions
      .filter(t => t.type === 'income' && new Date(t.date).getMonth() === new Date().getMonth())
      .reduce((acc, t) => acc + Number(t.amount), 0),
    expenseMonth: transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth())
      .reduce((acc, t) => acc + Number(t.amount), 0),
    currentBalance: (Number(localProfile?.saldo_atual || profile?.saldo_atual) || 0) + 
      transactions.reduce((acc, t) => acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0) +
      futureEvents
        .filter(f => f.type === 'income' && f.is_recurring && f.day <= new Date().getDate())
        .reduce((acc, f) => {
          // Check if this recurring income has already been recorded as a transaction this month
          const alreadyRecorded = transactions.some(t => 
            t.type === 'income' && 
            t.title === f.title && 
            new Date(t.date).getMonth() === new Date().getMonth() &&
            new Date(t.date).getFullYear() === new Date().getFullYear()
          );
          return alreadyRecorded ? acc : acc + Number(f.amount);
        }, 0),
    futureIncome: futureEvents
      .filter(f => f.type === 'income' && (f.day > new Date().getDate() || !f.is_recurring))
      .reduce((acc, f) => acc + Number(f.amount), 0),
    futureExpense: futureEvents.filter(f => f.type === 'expense').reduce((acc, f) => acc + Number(f.amount), 0),
  };

  useEffect(() => {
    if (profile) {
      console.log('Finance Profile:', profile);
      console.log('Saldo Inicial:', profile.saldo_atual);
      console.log('Transactions:', transactions.length);
    }
  }, [profile, transactions]);

  const leftAtMonthEnd = totals.incomeMonth + totals.futureIncome - totals.expenseMonth - totals.futureExpense;

  return { transactions, futureEvents, cards, goals, categories, totals, leftAtMonthEnd, loading, refresh: fetchData };
}
