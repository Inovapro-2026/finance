-- SQL Schema for INOVAPRO Finance & Tempo
-- Execute this in the Supabase SQL Editor

-- Create users_profile table
CREATE TABLE IF NOT EXISTS public.users_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT,
    sobrenome TEXT,
    email TEXT,
    telefone TEXT,
    tem_cartao BOOLEAN DEFAULT false,
    saldo_atual DECIMAL(12,2) DEFAULT 0,
    salario DECIMAL(12,2) DEFAULT 0,
    valor_pagamento DECIMAL(12,2) DEFAULT 0,
    dia_pagamento INTEGER,
    valor_adiantamento DECIMAL(12,2) DEFAULT 0,
    dia_adiantamento INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Ensure columns exist and fix existing data
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users_profile' AND column_name='saldo_atual') THEN
        ALTER TABLE public.users_profile ADD COLUMN saldo_atual DECIMAL(12,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users_profile' AND column_name='valor_pagamento') THEN
        ALTER TABLE public.users_profile ADD COLUMN valor_pagamento DECIMAL(12,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users_profile' AND column_name='valor_adiantamento') THEN
        ALTER TABLE public.users_profile ADD COLUMN valor_adiantamento DECIMAL(12,2) DEFAULT 0;
    END IF;
END $$;

-- Enable RLS for users_profile
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users_profile;
CREATE POLICY "Users can view their own profile" ON public.users_profile FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users_profile;
CREATE POLICY "Users can update their own profile" ON public.users_profile FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users_profile;
CREATE POLICY "Users can insert their own profile" ON public.users_profile FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create cards table
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    card_name TEXT NOT NULL,
    card_number_fake TEXT,
    card_holder_name TEXT,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    available_limit DECIMAL(12,2) DEFAULT 0,
    invoice_day INTEGER,
    closing_day INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own cards" ON public.cards;
CREATE POLICY "Users can manage their own cards" ON public.cards FOR ALL USING (auth.uid() = user_id);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
CREATE POLICY "Users can manage their own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

-- Create financial_goals table
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) DEFAULT 0,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own goals" ON public.financial_goals;
CREATE POLICY "Users can manage their own goals" ON public.financial_goals FOR ALL USING (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    title TEXT NOT NULL,
    category TEXT,
    amount DECIMAL(12,2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('debit', 'credit', 'pix', 'cash')),
    card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
CREATE POLICY "Users can manage their own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Create future_events table
CREATE TABLE IF NOT EXISTS public.future_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    title TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    day INTEGER, -- day of month for recurring
    due_date DATE, -- specific date for unique
    is_recurring BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.future_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own future events" ON public.future_events;
CREATE POLICY "Users can manage their own future events" ON public.future_events FOR ALL USING (auth.uid() = user_id);

-- Create time_tasks table
CREATE TABLE IF NOT EXISTS public.time_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date DATE,
    time TIME,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'in_progress')),
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.time_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own time tasks" ON public.time_tasks;
CREATE POLICY "Users can manage their own time tasks" ON public.time_tasks FOR ALL USING (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_nome TEXT;
  v_sobrenome TEXT;
  v_tem_cartao BOOLEAN;
  v_saldo_atual DECIMAL(12,2);
  v_valor_pagamento DECIMAL(12,2);
  v_dia_pagamento INTEGER;
  v_valor_adiantamento DECIMAL(12,2);
  v_dia_adiantamento INTEGER;
  v_salario_total DECIMAL(12,2);
BEGIN
  -- Extract and sanitize metadata with safe casting
  v_nome := new.raw_user_meta_data->>'nome';
  v_sobrenome := new.raw_user_meta_data->>'sobrenome';
  
  -- Use CASE to handle boolean extraction from text safely
  v_tem_cartao := CASE 
    WHEN (new.raw_user_meta_data->>'tem_cartao') = 'true' THEN true 
    WHEN (new.raw_user_meta_data->>'tem_cartao') = '1' THEN true
    ELSE false 
  END;

  -- Safe decimal conversion
  v_saldo_atual := COALESCE(NULLIF(new.raw_user_meta_data->>'saldo_atual', '')::decimal, 0);
  v_valor_pagamento := COALESCE(NULLIF(new.raw_user_meta_data->>'valor_pagamento', '')::decimal, 0);
  v_dia_pagamento := COALESCE(NULLIF(new.raw_user_meta_data->>'dia_pagamento', '')::integer, 1);
  v_valor_adiantamento := COALESCE(NULLIF(new.raw_user_meta_data->>'valor_adiantamento', '')::decimal, 0);
  v_dia_adiantamento := NULLIF(new.raw_user_meta_data->>'dia_adiantamento', '')::integer;
  
  v_salario_total := v_valor_pagamento + v_valor_adiantamento;

  INSERT INTO public.users_profile (
    user_id, email, nome, sobrenome, tem_cartao, saldo_atual, salario, valor_pagamento, dia_pagamento, valor_adiantamento, dia_adiantamento
  )
  VALUES (
    new.id, 
    new.email, 
    v_nome,
    v_sobrenome,
    v_tem_cartao,
    v_saldo_atual,
    v_salario_total,
    v_valor_pagamento,
    v_dia_pagamento,
    v_valor_adiantamento,
    v_dia_adiantamento
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    sobrenome = EXCLUDED.sobrenome,
    tem_cartao = EXCLUDED.tem_cartao,
    saldo_atual = EXCLUDED.saldo_atual,
    salario = EXCLUDED.salario,
    valor_pagamento = EXCLUDED.valor_pagamento,
    dia_pagamento = EXCLUDED.dia_pagamento,
    valor_adiantamento = EXCLUDED.valor_adiantamento,
    dia_adiantamento = EXCLUDED.dia_adiantamento;
  
  -- Create future events for income projections
  -- Payment
  IF v_valor_pagamento > 0 THEN
    INSERT INTO public.future_events (user_id, type, title, amount, day, is_recurring)
    VALUES (new.id, 'income', 'Pagamento Principal', v_valor_pagamento, v_dia_pagamento, true)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Advance
  IF v_valor_adiantamento > 0 AND v_dia_adiantamento IS NOT NULL THEN
     INSERT INTO public.future_events (user_id, type, title, amount, day, is_recurring)
     VALUES (new.id, 'income', 'Adiantamento Salarial', v_valor_adiantamento, v_dia_adiantamento, true)
     ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Extremely robust fallback
  INSERT INTO public.users_profile (user_id, email, nome)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'nome', new.email))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
