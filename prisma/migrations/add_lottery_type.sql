-- Add lottery_type column to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS lottery_type TEXT DEFAULT 'megasena';

-- Add lottery_type column to contests table  
ALTER TABLE contests ADD COLUMN IF NOT EXISTS lottery_type TEXT DEFAULT 'megasena';

-- Drop the old primary key constraint on contests (id only)
-- and create a new unique constraint on (id, lottery_type)
-- Note: This may fail if there's existing data - run manually if needed
-- ALTER TABLE contests DROP CONSTRAINT IF EXISTS contests_pkey;
-- ALTER TABLE contests ADD CONSTRAINT contests_pkey PRIMARY KEY (id, lottery_type);

-- For now, just add a unique index instead of changing the PK
CREATE UNIQUE INDEX IF NOT EXISTS contests_id_lottery_type_unique ON contests (id, lottery_type);
