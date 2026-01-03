-- Add next_draw_date column to contests table
ALTER TABLE contests 
ADD COLUMN next_draw_date TIMESTAMPTZ;

-- Optional: Update existing records with calculated next draw date
-- (This is just a placeholder, actual dates will come from API sync)
UPDATE contests 
SET next_draw_date = draw_date + INTERVAL '3 days'
WHERE next_draw_date IS NULL;
