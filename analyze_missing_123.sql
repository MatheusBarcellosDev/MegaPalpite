
-- Analisa frequência de jogos que NÃO possuem 1, 2 e 3 (Começam do 4 pra frente)
WITH Contests AS (
    SELECT 
        id,
        drawn_numbers
    FROM contests
    WHERE lottery_type = 'lotofacil'
),
Filtered AS (
    SELECT 
        id,
        drawn_numbers,
        CASE 
            WHEN NOT (ARRAY[1, 2, 3] && drawn_numbers) THEN 1 
            ELSE 0 
        END as sem_123
    FROM Contests
)
SELECT 
    COUNT(*) as "Total Jogos",
    SUM(sem_123) as "Jogos sem 1, 2 e 3",
    ROUND(SUM(sem_123) * 100.0 / COUNT(*), 2) || '%' as "Porcentagem"
FROM Filtered;

-- Lista os últimos 10 jogos que aconteceram isso pra conferir
SELECT 
    id as "Concurso",
    draw_date as "Data",
    drawn_numbers as "Dezenas"
FROM contests
WHERE lottery_type = 'lotofacil'
  AND NOT (ARRAY[1, 2, 3] && drawn_numbers)
ORDER BY id DESC
LIMIT 10;
