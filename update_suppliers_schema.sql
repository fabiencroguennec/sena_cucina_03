-- Add 'remarks' column to suppliers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'suppliers'
        AND column_name = 'remarks'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN remarks TEXT;
    END IF;
END $$;

NOTIFY pgrst, 'reload config';
