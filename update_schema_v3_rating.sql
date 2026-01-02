-- update_schema_v3_rating.sql

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5);
