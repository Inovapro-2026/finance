
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'member');
CREATE TYPE public.activity_type AS ENUM (
  'price_search', 'market_analysis', 'price_calculation',
  'product_created', 'product_updated', 'product_deleted',
  'ml_connected', 'ml_disconnected', 'ai_chat'
);
CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'danger');

-- =========================
-- updated_at trigger fn
-- =========================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT,
  cargo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- All authenticated team members can see each other (small internal team)
CREATE POLICY "Authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================
-- USER ROLES
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================
-- Auto-create profile on signup
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, cargo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'cargo', 'Membro')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- ML CONNECTIONS
-- =========================
CREATE TABLE public.ml_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ml_user_id TEXT,
  ml_nickname TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
ALTER TABLE public.ml_connections ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER ml_conn_updated BEFORE UPDATE ON public.ml_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Users manage own ml connection" ON public.ml_connections
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================
-- PRODUCTS
-- =========================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ml_item_id TEXT,
  title TEXT NOT NULL,
  sku TEXT,
  image_url TEXT,
  cost NUMERIC(12,2) DEFAULT 0,
  packaging_cost NUMERIC(12,2) DEFAULT 0,
  shipping_cost NUMERIC(12,2) DEFAULT 0,
  tax_percent NUMERIC(5,2) DEFAULT 0,
  operational_cost NUMERIC(12,2) DEFAULT 0,
  ads_cost NUMERIC(12,2) DEFAULT 0,
  desired_margin NUMERIC(5,2) DEFAULT 20,
  listing_type TEXT DEFAULT 'classico',
  recommended_price NUMERIC(12,2),
  current_price NUMERIC(12,2),
  status TEXT DEFAULT 'active',
  last_analyzed_at TIMESTAMPTZ,
  last_analyzed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Team-shared
CREATE POLICY "Team views all products" ON public.products
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team inserts products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team updates products" ON public.products
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Team deletes products" ON public.products
  FOR DELETE TO authenticated USING (true);

-- =========================
-- CALCULATIONS
-- =========================
CREATE TABLE public.calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  sku TEXT,
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team views calculations" ON public.calculations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own calculations" ON public.calculations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own calculations" ON public.calculations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================
-- MARKET ANALYSES + COMPETITORS
-- =========================
CREATE TABLE public.market_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  total_results INTEGER DEFAULT 0,
  min_price NUMERIC(12,2),
  max_price NUMERIC(12,2),
  avg_price NUMERIC(12,2),
  median_price NUMERIC(12,2),
  free_shipping_pct NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.market_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team views analyses" ON public.market_analyses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert analyses" ON public.market_analyses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.market_analyses(id) ON DELETE CASCADE,
  ml_item_id TEXT,
  title TEXT NOT NULL,
  price NUMERIC(12,2),
  image_url TEXT,
  permalink TEXT,
  seller_nickname TEXT,
  seller_reputation TEXT,
  free_shipping BOOLEAN DEFAULT false,
  listing_type TEXT,
  condition TEXT,
  sold_quantity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team views competitors" ON public.competitors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert competitors" ON public.competitors
  FOR INSERT TO authenticated WITH CHECK (true);

-- =========================
-- PRICE HISTORY
-- =========================
CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  price NUMERIC(12,2) NOT NULL,
  margin NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team views history" ON public.price_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team inserts history" ON public.price_history FOR INSERT TO authenticated WITH CHECK (true);

-- =========================
-- ALERTS
-- =========================
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team views alerts" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team inserts alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team updates alerts" ON public.alerts FOR UPDATE TO authenticated USING (true);

-- =========================
-- ACTIVITIES
-- =========================
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activities_created ON public.activities (created_at DESC);
CREATE INDEX idx_activities_user ON public.activities (user_id);
CREATE INDEX idx_activities_target ON public.activities (target);
CREATE POLICY "Team views activities" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own activities" ON public.activities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================
-- AI CHATS
-- =========================
CREATE TABLE public.ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Nova conversa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER ai_chats_updated BEFORE UPDATE ON public.ai_chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Users own ai chats" ON public.ai_chats
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.ai_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ai messages" ON public.ai_chat_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.ai_chats c WHERE c.id = chat_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Users insert own ai messages" ON public.ai_chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.ai_chats c WHERE c.id = chat_id AND c.user_id = auth.uid())
  );

-- =========================
-- TEAM CHAT
-- =========================
CREATE TABLE public.team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_team_messages_created ON public.team_messages (created_at DESC);
CREATE POLICY "Team members view team messages" ON public.team_messages
  FOR SELECT TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR recipient_id IS NULL);
CREATE POLICY "Members send messages" ON public.team_messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Recipients mark read" ON public.team_messages
  FOR UPDATE TO authenticated USING (recipient_id = auth.uid() OR sender_id = auth.uid());

CREATE TABLE public.team_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.team_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_message_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team views attachments" ON public.team_message_attachments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.team_messages m WHERE m.id = message_id
      AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid() OR m.recipient_id IS NULL))
  );
CREATE POLICY "Team inserts attachments" ON public.team_message_attachments
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.team_messages m WHERE m.id = message_id AND m.sender_id = auth.uid())
  );

-- Realtime
ALTER TABLE public.team_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
ALTER TABLE public.team_message_attachments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_message_attachments;
ALTER TABLE public.alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- =========================
-- USER SETTINGS
-- =========================
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER us_updated BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Users own settings" ON public.user_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================
-- STORAGE BUCKET
-- =========================
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated read chat attachments" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'chat-attachments');
CREATE POLICY "Authenticated upload chat attachments" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner deletes chat attachments" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
