-- Mega-Sena Smart Number Generator
-- Supabase Database Setup Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- TABLES
-- =====================

-- Games table: stores user generated games
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    numbers INTEGER[] NOT NULL CHECK (array_length(numbers, 1) = 6),
    explanation TEXT,
    contest_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Contests table: stores lottery contest results
CREATE TABLE IF NOT EXISTS public.contests (
    id INTEGER PRIMARY KEY,
    draw_date DATE NOT NULL,
    drawn_numbers INTEGER[] CHECK (array_length(drawn_numbers, 1) = 6),
    jackpot_value NUMERIC NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Results table: stores game results after checking
CREATE TABLE IF NOT EXISTS public.results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    hits INTEGER NOT NULL CHECK (hits >= 0 AND hits <= 6),
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(game_id)
);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX IF NOT EXISTS idx_games_user_id ON public.games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_contest_number ON public.games(contest_number);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON public.games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_game_id ON public.results(game_id);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS on all tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Games policies: users can only access their own games
CREATE POLICY "Users can view own games"
    ON public.games FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own games"
    ON public.games FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own games"
    ON public.games FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own games"
    ON public.games FOR DELETE
    USING (auth.uid() = user_id);

-- Contests policies: anyone can read, only service role can write
CREATE POLICY "Anyone can view contests"
    ON public.contests FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage contests"
    ON public.contests FOR ALL
    USING (auth.role() = 'service_role');

-- Results policies: users can only see results for their games
CREATE POLICY "Users can view own results"
    ON public.results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.games
            WHERE games.id = results.game_id
            AND games.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert results for own games"
    ON public.results FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.games
            WHERE games.id = game_id
            AND games.user_id = auth.uid()
        )
    );

-- =====================
-- FUNCTIONS (Optional)
-- =====================

-- Function to get user's statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
    total_games BIGINT,
    checked_games BIGINT,
    total_hits BIGINT,
    avg_hits NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT g.id)::BIGINT as total_games,
        COUNT(DISTINCT r.id)::BIGINT as checked_games,
        COALESCE(SUM(r.hits), 0)::BIGINT as total_hits,
        COALESCE(AVG(r.hits), 0)::NUMERIC as avg_hits
    FROM public.games g
    LEFT JOIN public.results r ON r.game_id = g.id
    WHERE g.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- SAMPLE DATA (Optional - for testing)
-- =====================

-- Insert a sample contest (uncomment if needed)
-- INSERT INTO public.contests (id, draw_date, drawn_numbers, jackpot_value)
-- VALUES (2800, '2024-12-17', ARRAY[5, 12, 23, 34, 45, 56], 50000000)
-- ON CONFLICT (id) DO NOTHING;
