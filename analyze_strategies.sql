-- 1. Resumo Geral de Desempenho das Estratégias na Lotofácil
-- Mostra quantos jogos foram feitos com cada estratégia e a taxa de sucesso geral (11+ acertos)
SELECT
  g.strategy as "Estratégia",
  COUNT(1) as "Total de Jogos",
  SUM(CASE WHEN r.hits = 11 THEN 1 ELSE 0 END) as "11 Acertos",
  SUM(CASE WHEN r.hits = 12 THEN 1 ELSE 0 END) as "12 Acertos",
  SUM(CASE WHEN r.hits = 13 THEN 1 ELSE 0 END) as "13 Acertos",
  SUM(CASE WHEN r.hits = 14 THEN 1 ELSE 0 END) as "14 Acertos",
  SUM(CASE WHEN r.hits = 15 THEN 1 ELSE 0 END) as "15 Acertos",
  SUM(CASE WHEN r.hits >= 11 THEN 1 ELSE 0 END) as "Total de Prêmios",
  ROUND(SUM(CASE WHEN r.hits >= 11 THEN 1.0 ELSE 0.0 END) / COUNT(1) * 100, 2) || '%' as "Taxa de Sucesso"
FROM games g
JOIN results r ON g.id = r.game_id
WHERE g.lottery_type = 'lotofacil'
GROUP BY g.strategy
ORDER BY "Total de Prêmios" DESC;

-- 2. Média e Máximo de Acertos por Estratégia
-- Mostra a média de acertos (para ver se alguma fica consistentemente perto de 11) e o máximo de acertos alcançado
SELECT
  g.strategy as "Estratégia",
  COUNT(1) as "Total de Jogos",
  ROUND(AVG(r.hits), 2) as "Média de Acertos",
  MAX(r.hits) as "Máximo de Acertos Alcançado"
FROM games g
JOIN results r ON g.id = r.game_id
WHERE g.lottery_type = 'lotofacil'
GROUP BY g.strategy
ORDER BY "Média de Acertos" DESC;

-- 3. Histórico dos Melhores Jogos (13, 14 ou 15 acertos)
-- Lista detalhada dos jogos em que quase ganhamos prêmios maiores
SELECT
  g.id as "ID do Jogo",
  g.strategy as "Estratégia",
  g.contest_number as "Concurso",
  g.numbers as "Números Jogados",
  r.hits as "Acertos",
  g.created_at as "Data do Jogo"
FROM games g
JOIN results r ON g.id = r.game_id
WHERE g.lottery_type = 'lotofacil' 
  AND r.hits >= 13
ORDER BY r.hits DESC, g.contest_number DESC;
