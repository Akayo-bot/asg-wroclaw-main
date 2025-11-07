-- Create enums for article and event management
CREATE TYPE public.article_status AS ENUM ('draft', 'published');
CREATE TYPE public.article_category AS ENUM ('tactics', 'equipment', 'news', 'game_reports', 'rules');
CREATE TYPE public.event_status AS ENUM ('upcoming', 'registration_open', 'registration_closed', 'completed', 'cancelled');

-- Articles table
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_uk TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  title_pl TEXT NOT NULL,
  preview_uk TEXT NOT NULL,
  preview_ru TEXT NOT NULL,
  preview_pl TEXT NOT NULL,
  content_uk TEXT NOT NULL,
  content_ru TEXT NOT NULL,
  content_pl TEXT NOT NULL,
  main_image_url TEXT,
  category article_category NOT NULL,
  status article_status NOT NULL DEFAULT 'draft',
  author_id UUID NOT NULL,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_uk TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  title_pl TEXT NOT NULL,
  description_uk TEXT NOT NULL,
  description_ru TEXT NOT NULL,
  description_pl TEXT NOT NULL,
  scenario_uk TEXT,
  scenario_ru TEXT,
  scenario_pl TEXT,
  rules_uk TEXT,
  rules_ru TEXT,
  rules_pl TEXT,
  location_uk TEXT NOT NULL,
  location_ru TEXT NOT NULL,
  location_pl TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  price DECIMAL(10,2),
  max_participants INTEGER,
  status event_status NOT NULL DEFAULT 'upcoming',
  main_image_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Gallery table
CREATE TABLE public.gallery_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_uk TEXT,
  title_ru TEXT,
  title_pl TEXT,
  description_uk TEXT,
  description_ru TEXT,
  description_pl TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  thumbnail_url TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  callsign TEXT NOT NULL,
  real_name TEXT,
  role_uk TEXT NOT NULL,
  role_ru TEXT NOT NULL,
  role_pl TEXT NOT NULL,
  bio_uk TEXT,
  bio_ru TEXT,
  bio_pl TEXT,
  photo_url TEXT,
  social_links JSONB,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for articles
CREATE POLICY "Everyone can view published articles" 
ON public.articles FOR SELECT 
USING (status = 'published' OR get_current_user_role() IN ('admin', 'editor'));

CREATE POLICY "Editors and admins can manage articles" 
ON public.articles FOR ALL 
USING (get_current_user_role() IN ('admin', 'editor'))
WITH CHECK (get_current_user_role() IN ('admin', 'editor'));

-- RLS Policies for events
CREATE POLICY "Everyone can view events" 
ON public.events FOR SELECT 
USING (true);

CREATE POLICY "Editors and admins can manage events" 
ON public.events FOR ALL 
USING (get_current_user_role() IN ('admin', 'editor'))
WITH CHECK (get_current_user_role() IN ('admin', 'editor'));

-- RLS Policies for gallery
CREATE POLICY "Everyone can view gallery items" 
ON public.gallery_items FOR SELECT 
USING (true);

CREATE POLICY "Editors and admins can manage gallery" 
ON public.gallery_items FOR ALL 
USING (get_current_user_role() IN ('admin', 'editor'))
WITH CHECK (get_current_user_role() IN ('admin', 'editor'));

-- RLS Policies for team members
CREATE POLICY "Everyone can view active team members" 
ON public.team_members FOR SELECT 
USING (is_active = true OR get_current_user_role() IN ('admin', 'editor'));

CREATE POLICY "Admins can manage team members" 
ON public.team_members FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Add triggers for updated_at
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gallery_items_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_articles_category ON public.articles(category);
CREATE INDEX idx_articles_author ON public.articles(author_id);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_gallery_type ON public.gallery_items(file_type);
CREATE INDEX idx_team_members_active ON public.team_members(is_active);

-- Function to get admin statistics
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_articles', (SELECT COUNT(*) FROM articles),
    'published_articles', (SELECT COUNT(*) FROM articles WHERE status = 'published'),
    'draft_articles', (SELECT COUNT(*) FROM articles WHERE status = 'draft'),
    'total_events', (SELECT COUNT(*) FROM events),
    'upcoming_events', (SELECT COUNT(*) FROM events WHERE status IN ('upcoming', 'registration_open')),
    'completed_events', (SELECT COUNT(*) FROM events WHERE status = 'completed'),
    'total_users', (SELECT COUNT(*) FROM profiles),
    'admin_users', (SELECT COUNT(*) FROM profiles WHERE role = 'admin'),
    'editor_users', (SELECT COUNT(*) FROM profiles WHERE role = 'editor'),
    'regular_users', (SELECT COUNT(*) FROM profiles WHERE role = 'user'),
    'total_registrations', (SELECT COUNT(*) FROM event_registrations),
    'gallery_items', (SELECT COUNT(*) FROM gallery_items),
    'team_members', (SELECT COUNT(*) FROM team_members WHERE is_active = true)
  );
$$;