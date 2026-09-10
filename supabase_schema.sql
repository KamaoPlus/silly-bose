-- ==============================================================================
-- YOUTUBE PRODUCTION OS — SUPABASE SCHEMA MIGRATION
-- Copy and run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gsactdpoyhlampexhcsw/sql/new
-- ==============================================================================

-- 1. WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS public.workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    admin_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. USERS & ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Admin',
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT true,
    joined_date TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. CHANNELS TABLE
CREATE TABLE IF NOT EXISTS public.channels (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    handle TEXT,
    color TEXT DEFAULT '#4f46e5',
    disabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. TEAM MEMBERS TABLE (Optional normalized alias for users assigned to channels)
CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY,
    channel_id TEXT REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES (Allow anon key reads and writes for app operational access)
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write on workspaces" ON public.workspaces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on channels" ON public.channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);

-- 6. SEED INITIAL PRIMARY STUDIO DATA
INSERT INTO public.workspaces (id, name, description, admin_phone)
VALUES ('ws-main', 'Primary Studio Workspace', 'Main YouTube production hub and default operational workspace.', '9876543200')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, name, phone, password, role, workspace_id, active, joined_date)
VALUES 
  ('emp-superadmin', 'Super Admin', '9769369798', 'admin', 'Super Admin', 'ws-main', true, '2025-01-01'),
  ('emp-admin-main', 'Vikash Mehta', '9876543200', 'admin', 'Admin', 'ws-main', true, '2025-01-05')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.channels (id, workspace_id, name, handle, color, disabled)
VALUES 
  ('ch-1', 'ws-main', 'Tech Insights', '@techinsights', '#4f46e5', false),
  ('ch-2', 'ws-main', 'Finance Hub', '@financehub', '#059669', false),
  ('ch-3', 'ws-main', 'Lifestyle & Vlogs', '@lifestylevibes', '#d97706', false)
ON CONFLICT (id) DO NOTHING;
