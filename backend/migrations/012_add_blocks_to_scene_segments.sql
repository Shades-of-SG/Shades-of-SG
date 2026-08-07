ALTER TABLE scene_segments 
ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '[]'::jsonb;
