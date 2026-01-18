
-- Tabela temporária com os dados expandidos de números sorteados
WITH Numbers AS (
    SELECT 
        id, 
        unnest(drawn_numbers) as num 
    FROM contests 
    WHERE lottery_type = 'lotofacil'
),

-- 1. Análise de Primos (2, 3, 5, 7, 11, 13, 17, 19, 23)
ContestPrimes AS (
    SELECT 
        id,
        COUNT(*) FILTER (WHERE num IN (2, 3, 5, 7, 11, 13, 17, 19, 23)) as prime_count
    FROM Numbers
    GROUP BY id
),
PrimeDist AS (
    SELECT 
        prime_count,
        COUNT(*) as freq,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contests WHERE lottery_type = 'lotofacil'), 2) as pct
    FROM ContestPrimes
    GROUP BY prime_count
),

-- 2. Análise de Pares/Ímpares
ContestParity AS (
    SELECT 
        id,
        COUNT(*) FILTER (WHERE num % 2 != 0) as odd_count,
        COUNT(*) FILTER (WHERE num % 2 = 0) as even_count
    FROM Numbers
    GROUP BY id
),
ParityDist AS (
    SELECT 
        odd_count || ' Ímpares / ' || even_count || ' Pares' as distribution,
        COUNT(*) as freq,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contests WHERE lottery_type = 'lotofacil'), 2) as pct
    FROM ContestParity
    GROUP BY odd_count, even_count
    ORDER BY freq DESC
)

-- Resultado Final
SELECT 'DISTRIBUIÇÃO PRIMOS' as category, prime_count::text as value, freq, pct FROM PrimeDist
UNION ALL
SELECT 'PAR/ÍMPAR', distribution, freq, pct FROM ParityDist;
