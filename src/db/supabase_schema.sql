-- ====================================================================
-- NURSING GRADUATION 2027 — SCRUB NIGHT
-- Production PostgreSQL Database Schema & Row-Level Security (RLS) for Supabase
-- ====================================================================

-- 1. Profiles (matches Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  student_id TEXT,
  role TEXT NOT NULL DEFAULT 'graduate' CHECK (role IN ('graduate', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. User Roles & Permissions
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'finance_officer', 'organizer', 'graduate')),
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Graduate Registrations & Status
CREATE TABLE IF NOT EXISTS public.graduates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  student_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  total_due_iqd BIGINT NOT NULL DEFAULT 150000,
  total_paid_iqd BIGINT NOT NULL DEFAULT 0,
  remaining_balance_iqd BIGINT GENERATED ALWAYS AS (total_due_iqd - total_paid_iqd) STORED,
  notes TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Payment Transactions (Auditable Ledger)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT UNIQUE NOT NULL,
  graduate_id UUID NOT NULL REFERENCES public.graduates(id) ON DELETE RESTRICT,
  graduate_name TEXT NOT NULL,
  amount_iqd BIGINT NOT NULL CHECK (amount_iqd > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_time TIME NOT NULL DEFAULT CURRENT_TIME,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'electronic_pending')),
  reference_code TEXT NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  is_verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Event Settings & Configuration
CREATE TABLE IF NOT EXISTS public.event_settings (
  id TEXT PRIMARY KEY DEFAULT 'current_config',
  brand_name TEXT NOT NULL DEFAULT 'NURSING GRADUATION 2027',
  brand_subtitle TEXT NOT NULL DEFAULT 'SCRUB NIGHT',
  event_type TEXT NOT NULL DEFAULT 'Nursing graduation and scrub party',
  scrub_party_date TIMESTAMPTZ NOT NULL DEFAULT '2026-12-12T18:00:00+03:00',
  scrub_party_date_display TEXT NOT NULL DEFAULT '12/12/2026',
  scrub_party_location TEXT DEFAULT 'سيتم الإعلان عن القاعة رسمياً لاحقاً',
  scrub_party_dress_code TEXT DEFAULT 'السكراب الطبي المعتمد',
  official_graduation_year TEXT NOT NULL DEFAULT '2027',
  official_graduation_status TEXT NOT NULL DEFAULT 'coming_soon',
  official_graduation_date TEXT DEFAULT 'التفاصيل قريباً',
  official_graduation_location TEXT DEFAULT 'سيتم الإعلان عنها لاحقاً',
  official_graduation_schedule TEXT DEFAULT 'جدول المراسيم قيد الإعداد',
  instagram_url TEXT NOT NULL DEFAULT 'https://www.instagram.com/uofaon.1/',
  ticket_price_iqd BIGINT NOT NULL DEFAULT 150000,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  published_at DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  display_order INT NOT NULL DEFAULT 1,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 7. Media Assets (Public)
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('scrub_night', 'official_grad', 'team', 'posters', 'memories')),
  url TEXT NOT NULL,
  caption TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  uploaded_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 8. Graduate Private Media (Securely Restricted to Graduate)
CREATE TABLE IF NOT EXISTS public.graduate_private_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  graduate_id UUID NOT NULL REFERENCES public.graduates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  size_bytes BIGINT DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 9. Administrator Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  details TEXT NOT NULL,
  entity_type TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graduates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graduate_private_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles policy
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Graduates table policies
CREATE POLICY "Graduates can read their own record" ON public.graduates
  FOR SELECT USING (
    profile_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "Only admins can insert or update graduates" ON public.graduates
  FOR ALL USING (public.is_admin());

-- 3. Payment transactions policy
CREATE POLICY "Graduates can view only their own payments" ON public.payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.graduates
      WHERE public.graduates.id = payment_transactions.graduate_id
      AND public.graduates.profile_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Only admins can record payments" ON public.payment_transactions
  FOR INSERT WITH CHECK (public.is_admin());

-- 4. Event settings & Announcements (Public Read, Admin Write)
CREATE POLICY "Public can view event settings" ON public.event_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update event settings" ON public.event_settings
  FOR ALL USING (public.is_admin());

CREATE POLICY "Public can view published announcements" ON public.announcements
  FOR SELECT USING (status = 'published' OR public.is_admin());

CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING (public.is_admin());

-- 5. Public media
CREATE POLICY "Public can view public media" ON public.media_assets
  FOR SELECT USING (is_public = true OR public.is_admin());

CREATE POLICY "Admins can manage media" ON public.media_assets
  FOR ALL USING (public.is_admin());

-- 6. Private graduate media (Strictly bounded)
CREATE POLICY "Graduates access only their own private media" ON public.graduate_private_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.graduates
      WHERE public.graduates.id = graduate_private_media.graduate_id
      AND public.graduates.profile_id = auth.uid()
    ) OR public.is_admin()
  );

-- 7. Audit logs (Admin only)
CREATE POLICY "Only admins view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "System can record audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);
