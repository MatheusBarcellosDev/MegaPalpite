# Análise das Estratégias da Lotofácil

Analisei a fundo o seu algoritmo em `src/lib/lottery/generator.ts`. O gerador atual já usa técnicas muito boas (Moldura, Fibonacci, Primos, etc.), no entanto, existem algumas "armadilhas" na forma como o código aplica esses filtros que podem estar jogando contra as suas chances de prêmio.

## ⚠️ O Que Pode Estar Dando Errado (Pontos Críticos)

1. **Destruição da Estratégia Inicial (`rebalance`)**:
   Quando você escolhe jogar com a estratégia "Quente" (Hot), o sistema seleciona 10 dezenas quentes, 2 frias e 3 balanceadas. Isso é ótimo. **Porém**, se essa combinação inicial falhar em alguma regra (ex: deu 10 ímpares e o máximo é 9), o sistema chama a função `rebalance`.
   *O problema:* A função `rebalance` pega uma dezena escolhida e troca por *qualquer outra aleatória* do volante inteiro, ignorando se ela era quente ou fria. Se o jogo for rebalanceado muitas vezes para passar nos filtros, ele vira praticamente um jogo "Aleatório Puro", matando a sua tática original.

2. **Limite de Sequências Muito Restrito**:
   Para a Lotofácil, você está evitando sequências maiores que 4 (`maxSeq = isLotofacil ? 4 : 2`). Na Mega-sena, evitar 3 ou 4 seguidos faz sentido. Mas na Lotofácil, como você sorteia 15 de 25 números, **ter 5 ou 6 números em sequência é extremamente comum**. Ao travar em 4, você está descartando muitas combinações reais que dão prêmio de 14 ou 15.

3. **Soma (Sum) Otimizável**:
   Você limitou a soma entre 170 e 220. É um intervalo bom (a média é 195). Porém, os prêmios grandes (14 e 15) costumam se concentrar num miolo ainda mais apertado, entre **180 e 210**. Reduzir as pontas pode eliminar "lixo estatístico".

---

## 🚀 Táticas Novas que Podemos Implementar

### 1. **Cruzamento de Linhas e Colunas (Padrões de Geometria)**
Sorteios da Lotofácil raramente têm uma linha (1-5, 6-10, etc.) ou coluna totalmente vazia.
**Tática:** Garantir que o jogo tenha pelo menos 1 a 4 números por linha e coluna. Jamais linhas vazias completas.

### 2. **Ciclo das Dezenas**
A Lotofácil tem uma estatística famosa chamada "Ciclo das Dezenas". Leva em média 3 a 5 concursos para que todos os 25 números sejam sorteados pelo menos uma vez.
**Tática:** Criar a estratégia `"closingCycle"`. O algoritmo verifica quais dezenas ainda não saíram no ciclo atual e obriga que todas (ou quase todas) estejam presentes no próximo jogo gerado, completando com as demais quentes.

### 3. **Melhoria no "Repetente" (As 9 do Concurso Anterior)**
Atualmente, a lotofácil repete entre 7 e 11, mas a imensa maioria dos casos repete exatamente **8, 9 ou 10** do concurso passado (sendo 9 o rei isolado com ~33% das vezes).
**Tática:** Criar variações da estratégia "repeater", onde você trava exatamente "Repetir 9 Secas" e cruza com "Forte/Fraca".

---

## 📊 SQLs para Análise (Como Testar o que deu certo)

Criei um arquivo na raiz do seu projeto chamado `analyze_strategies.sql` com as querys abaixo para você rodar direto no Supabase. Elas vão te dizer qual estratégia tem te dado mais retorno.

*(Se quiser rodar direto por linha de comando no terminal do projeto, execute:)*
\`\`\`bash
npx prisma db execute --file analyze_strategies.sql --url "$DATABASE_URL"
\`\`\`

**O que as Queries vão te mostrar:**
1. **Resumo Geral:** Mostra quantos jogos cada tática fez e quantos prêmios de 11, 12, 13, 14 e 15 trouxe (Taxa de sucesso).
2. **Média de Acertos:** Mostra se alguma tática, mesmo sem dar prêmio alto de 14/15, está constantemente batendo "na trave" com média 9, 10 acertos.
3. **Melhores Jogos:** Histórico puro dos jogos que fizeram 13 pontos ou mais.
