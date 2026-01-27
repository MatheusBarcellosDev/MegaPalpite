
-- Análise de Filtros: Distribuição nos últimos 500 concursos da Lotofácil
-- Execute cada query separadamente

-- 1. ANÁLISE DE ÍMPARES
WITH LotofacilContests AS (
    SELECT 
        id,
        drawn_numbers
    FROM contests
    WHERE lottery_type = 'lotofacil'
    ORDER BY id DESC
    LIMIT 500
)
SELECT 
    'ÍMPARES' as filtro,
    (SELECT COUNT(*) FROM unnest(drawn_numbers) n WHERE n % 2 = 1) as quantidade,
    COUNT(*) as jogos,
    ROUND(COUNT(*) * 100.0 / 500, 1) || '%' as porcentagem
FROM LotofacilContests
GROUP BY quantidade
ORDER BY quantidade;

-- 2. ANÁLISE DE PRIMOS
WITH LotofacilContests AS (
    SELECT id, drawn_numbers
    FROM contests WHERE lottery_type = 'lotofacil'
    ORDER BY id DESC LIMIT 500
)
SELECT 
    'PRIMOS' as filtro,
    (SELECT COUNT(*) FROM unnest(drawn_numbers) n WHERE n IN (2,3,5,7,11,13,17,19,23)) as quantidade,
    COUNT(*) as jogos,
    ROUND(COUNT(*) * 100.0 / 500, 1) || '%' as porcentagem
FROM LotofacilContests
GROUP BY quantidade
ORDER BY quantidade;

-- 3. ANÁLISE DE MOLDURA
WITH LotofacilContests AS (
    SELECT id, drawn_numbers
    FROM contests WHERE lottery_type = 'lotofacil'
    ORDER BY id DESC LIMIT 500
)
SELECT 
    'MOLDURA' as filtro,
    (SELECT COUNT(*) FROM unnest(drawn_numbers) n WHERE n IN (1,2,3,4,5,6,10,11,15,16,20,21,22,23,24,25)) as quantidade,
    COUNT(*) as jogos,
    ROUND(COUNT(*) * 100.0 / 500, 1) || '%' as porcentagem
FROM LotofacilContests
GROUP BY quantidade
ORDER BY quantidade;

-- 4. ANÁLISE DE FIBONACCI
WITH LotofacilContests AS (
    SELECT id, drawn_numbers
    FROM contests WHERE lottery_type = 'lotofacil'
    ORDER BY id DESC LIMIT 500
)
SELECT 
    'FIBONACCI' as filtro,
    (SELECT COUNT(*) FROM unnest(drawn_numbers) n WHERE n IN (1,2,3,5,8,13,21)) as quantidade,
    COUNT(*) as jogos,
    ROUND(COUNT(*) * 100.0 / 500, 1) || '%' as porcentagem
FROM LotofacilContests
GROUP BY quantidade
ORDER BY quantidade;

-- 5. ANÁLISE DE SOMA (FAIXAS)
WITH LotofacilContests AS (
    SELECT id, drawn_numbers
    FROM contests WHERE lottery_type = 'lotofacil'
    ORDER BY id DESC LIMIT 500
)
SELECT 
    'SOMA' as filtro,
    CASE 
        WHEN (SELECT SUM(n) FROM unnest(drawn_numbers) n) < 170 THEN '< 170'
        WHEN (SELECT SUM(n) FROM unnest(drawn_numbers) n) BETWEEN 170 AND 179 THEN '170-179'
        WHEN (SELECT SUM(n) FROM unnest(drawn_numbers) n) BETWEEN 180 AND 189 THEN '180-189'
        WHEN (SELECT SUM(n) FROM unnest(drawn_numbers) n) BETWEEN 190 AND 199 THEN '190-199'
        WHEN (SELECT SUM(n) FROM unnest(drawn_numbers) n) BETWEEN 200 AND 209 THEN '200-209'
        WHEN (SELECT SUM(n) FROM unnest(drawn_numbers) n) BETWEEN 210 AND 220 THEN '210-220'
        ELSE '> 220'
    END as faixa,
    COUNT(*) as jogos,
    ROUND(COUNT(*) * 100.0 / 500, 1) || '%' as porcentagem
FROM LotofacilContests
GROUP BY faixa
ORDER BY faixa;

-- 6. ANÁLISE DE REPETIÇÃO DO ANTERIOR
WITH LotofacilContests AS (
    SELECT 
        id,
        drawn_numbers,
        LAG(drawn_numbers) OVER (ORDER BY id) as previous_numbers
    FROM contests
    WHERE lottery_type = 'lotofacil'
    ORDER BY id DESC
    LIMIT 501
)
SELECT 
    'REPETIÇÃO' as filtro,
    (SELECT COUNT(*) FROM unnest(drawn_numbers) n WHERE n = ANY(previous_numbers)) as quantidade,
    COUNT(*) as jogos,
    ROUND(COUNT(*) * 100.0 / 500, 1) || '%' as porcentagem
FROM LotofacilContests
WHERE previous_numbers IS NOT NULL
GROUP BY quantidade
ORDER BY quantidade;
