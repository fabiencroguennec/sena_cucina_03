-- Add incompatible_diets column to ingredients table to store IDs of incompatible dietary tags
ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS incompatible_diets TEXT[] DEFAULT '{}';
