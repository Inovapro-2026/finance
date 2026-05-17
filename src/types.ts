export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'debit' | 'credit' | 'pix' | 'cash';
export type TaskStatus = 'pending' | 'completed' | 'in_progress';
export type EventStatus = 'pending' | 'completed';

export interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  sobrenome?: string;
  email: string;
  telefone?: string;
  tem_cartao?: boolean;
  saldo_atual?: number;
  salario?: number;
  valor_pagamento?: number;
  dia_pagamento?: number;
  valor_adiantamento?: number;
  dia_adiantamento?: number;
  created_at: string;
}

export interface Card {
  id: string;
  user_id: string;
  card_name: string;
  card_number_fake: string;
  card_holder_name: string;
  credit_limit: number;
  available_limit: number;
  invoice_day: number;
  closing_day: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  title: string;
  category: string;
  amount: number;
  payment_method: PaymentMethod;
  card_id?: string;
  date: string;
  created_at: string;
}

export interface FutureEvent {
  id: string;
  user_id: string;
  type: TransactionType;
  title: string;
  amount: number;
  day?: number;
  due_date?: string;
  is_recurring: boolean;
  status: EventStatus;
  created_at: string;
}

export interface TimeTask {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  status: TaskStatus;
  is_recurring: boolean;
  created_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  created_at: string;
}

export type AppMode = 'finance' | 'time';
export type ActiveTab = 'dashboard' | 'card' | 'mic' | 'analysis' | 'profile';
