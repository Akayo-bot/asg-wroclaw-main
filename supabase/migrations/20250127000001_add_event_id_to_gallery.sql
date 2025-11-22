-- Add event_id foreign key to gallery_items table
-- This creates a hierarchical archive: Event → Media

-- Add event_id column to gallery_items
ALTER TABLE public.gallery_items 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- Create index for better performance on event queries
CREATE INDEX IF NOT EXISTS idx_gallery_items_event_id ON public.gallery_items(event_id);

-- Add comment
COMMENT ON COLUMN public.gallery_items.event_id IS 
  'Foreign key to events table. Links gallery items to specific events. NULL means item is not linked to any event.';



