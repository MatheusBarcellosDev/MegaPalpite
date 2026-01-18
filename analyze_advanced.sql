
-- DADOS AVANÇADOS DE PADRÕES LOTOFÁCIL

WITH Numbers AS (
    SELECT 
        id, 
        unnest(drawn_numbers) as num 
    FROM contests 
    WHERE lottery_type = 'lotofacil'
),

-- 1. SOMA DAS DEZENAS
-- Padrão: A soma costuma ficar entre 180 e 220
ContestSum AS (
    SELECT id, SUM(num) as total_sum
    FROM Numbers
    GROUP BY id
),
SumStats AS (
    SELECT 
        CASE 
            WHEN total_sum < 180 THEN 'Baixa (<180)'
            WHEN total_sum BETWEEN 180 AND 220 THEN 'Ideal (180-220)'
            ELSE 'Alta (>220)'
        END as range,
        COUNT(*) as freq,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contests WHERE lottery_type = 'lotofacil'), 2) as pct
    FROM ContestSum
    GROUP BY range
),

-- 2. NÚMEROS NA MOLDURA (Borda do cartão)
-- Números: 1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25
-- Padrão: 9 a 11 números na moldura
ContestFrame AS (
    SELECT 
        id,
        COUNT(*) FILTER (WHERE num IN (1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25)) as frame_count
    FROM Numbers
    GROUP BY id
),
FrameStats AS (
    SELECT 
        frame_count,
        COUNT(*) as freq,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contests WHERE lottery_type = 'lotofacil'), 2) as pct
    FROM ContestFrame
    GROUP BY frame_count
),

-- 3. NÚMEROS DE FIBONACCI
-- Números: 1, 2, 3, 5, 8, 13, 21
-- Padrão: 3 a 5 números
ContestFib AS (
    SELECT 
        id,
        COUNT(*) FILTER (WHERE num IN (1, 2, 3, 5, 8, 13, 21)) as fib_count
    FROM Numbers
    GROUP BY id
),
FibStats AS (
    SELECT 
        fib_count,
        COUNT(*) as freq,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contests WHERE lottery_type = 'lotofacil'), 2) as pct
    FROM ContestFib
    GROUP BY fib_count
),

-- 4. REPETIÇÃO DO ANTERIOR (Requires joining with previous contest)
-- Padrão: 8 a 10 repetidos
ContestRepeats AS (
    SELECT 
        c1.id,
        (SELECT COUNT(*) 
         FROM unnest(c1.drawn_numbers) n 
         WHERE n = ANY(c2.drawn_numbers)) as repeat_count
    FROM contests c1
    JOIN contests c2 ON c2.id = c1.id - 1
    WHERE c1.lottery_type = 'lotofacil' AND c2.lottery_type = 'lotofacil'
),
RepeatStats AS (
    SELECT 
        repeat_count,
        COUNT(*) as freq,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ContestRepeats), 2) as pct
    FROM ContestRepeats
    GROUP BY repeat_count
)

-- RELATÓRIO FINAL
SELECT 'SOMA' as category, range as value, freq, pct FROM SumStats
UNION ALL
SELECT 'MOLDURA (FRAME)', frame_count::text, freq, pct FROM FrameStats
UNION ALL
SELECT 'FIBONACCI', fib_count::text, freq, pct FROM FibStats
UNION ALL
SELECT 'REPETIÇÃO ANTERIOR', repeat_count::text, freq, pct FROM RepeatStats
ORDER BY category, freq DESC;
