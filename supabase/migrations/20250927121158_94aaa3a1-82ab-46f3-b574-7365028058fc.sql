-- Add new fields to events table for enhanced functionality
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS start_datetime timestamp with time zone,
ADD COLUMN IF NOT EXISTS registration_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS location_uk text,
ADD COLUMN IF NOT EXISTS location_ru text, 
ADD COLUMN IF NOT EXISTS location_pl text,
ADD COLUMN IF NOT EXISTS location_en text,
ADD COLUMN IF NOT EXISTS map_url text,
ADD COLUMN IF NOT EXISTS status_registration text DEFAULT 'open' CHECK (status_registration IN ('open', 'closed', 'waitlist')),
ADD COLUMN IF NOT EXISTS cover_url text,
ADD COLUMN IF NOT EXISTS limit_mode text DEFAULT 'unlimited' CHECK (limit_mode IN ('unlimited', 'ranged')),
ADD COLUMN IF NOT EXISTS price_amount numeric,
ADD COLUMN IF NOT EXISTS price_currency text DEFAULT 'PLN' CHECK (price_currency IN ('PLN', 'USD', 'EUR', 'UAH'));

-- Update existing events to have start_datetime from event_date if null
UPDATE public.events 
SET start_datetime = event_date 
WHERE start_datetime IS NULL;

-- Add English fields to articles table
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS seo_title_uk text,
ADD COLUMN IF NOT EXISTS seo_title_ru text,
ADD COLUMN IF NOT EXISTS seo_title_pl text,
ADD COLUMN IF NOT EXISTS seo_title_en text,
ADD COLUMN IF NOT EXISTS seo_description_uk text,
ADD COLUMN IF NOT EXISTS seo_description_ru text,
ADD COLUMN IF NOT EXISTS seo_description_pl text,
ADD COLUMN IF NOT EXISTS seo_description_en text;

-- Update gallery_items and team_members tables to ensure consistency
-- (These already have English fields based on the schema)

-- Create index for better performance on event queries
CREATE INDEX IF NOT EXISTS idx_events_start_datetime ON public.events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);

-- Create function to automatically cancel events with insufficient participants
CREATE OR REPLACE FUNCTION public.check_event_cancellation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cancel events that start today and have insufficient participants
  UPDATE public.events 
  SET 
    status = 'cancelled'::event_status,
    status_registration = 'closed',
    updated_at = now()
  WHERE 
    DATE(start_datetime) = CURRENT_DATE
    AND status NOT IN ('cancelled'::event_status, 'completed'::event_status)
    AND limit_mode = 'ranged'
    AND min_players IS NOT NULL
    AND (
      SELECT COUNT(*) 
      FROM public.event_registrations 
      WHERE event_id = events.id 
      AND status = 'confirmed'::registration_status
    ) < min_players;
END;
$$;

-- Update the validation trigger to handle new fields
DROP TRIGGER IF EXISTS validate_event_limits_trigger ON public.events;

CREATE OR REPLACE FUNCTION public.validate_event_limits()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate ranged limits
  IF NEW.limit_mode = 'ranged' THEN
    IF NEW.min_players IS NULL OR NEW.max_players IS NULL THEN
      RAISE EXCEPTION 'min_players and max_players are required when limit_mode is ranged';
    END IF;
    
    IF NEW.min_players <= 0 OR NEW.max_players <= 0 THEN
      RAISE EXCEPTION 'min_players and max_players must be greater than 0';
    END IF;
    
    IF NEW.min_players > NEW.max_players THEN
      RAISE EXCEPTION 'min_players cannot be greater than max_players';
    END IF;
  END IF;
  
  -- Validate price and currency
  IF NEW.price_amount IS NOT NULL AND NEW.price_amount < 0 THEN
    RAISE EXCEPTION 'price_amount cannot be negative';
  END IF;
  
  -- Validate registration deadline
  IF NEW.registration_deadline IS NOT NULL AND NEW.start_datetime IS NOT NULL THEN
    IF NEW.registration_deadline > NEW.start_datetime THEN
      RAISE EXCEPTION 'registration_deadline cannot be after start_datetime';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_event_limits_trigger
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_event_limits();