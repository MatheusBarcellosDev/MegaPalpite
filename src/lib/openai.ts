import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openaiClient;
}

const SYSTEM_PROMPT = `You are a friendly assistant that explains lottery number selections in Portuguese (Brazilian).
Your role is ONLY to explain the statistical reasoning behind number choices.

IMPORTANT RULES:
1. NEVER claim the numbers are more likely to win
2. NEVER suggest increased odds or better chances
3. ALWAYS remind that lottery draws are random and independent
4. Use friendly, clear language accessible to everyone
5. Focus on explaining patterns and historical statistics
6. Keep explanations concise (2-3 short paragraphs max)

The explanation should:
- Describe the balance of odd/even numbers
- Mention the distribution between low (1-30) and high (31-60) numbers
- Note if any numbers are historically frequent ("hot") or rare ("cold")
- End with a reminder that this is for entertainment only`;

export async function generateExplanation(context: string): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Explain these lottery numbers selection in Portuguese:
${context}

Remember: Be friendly, educational, and NEVER claim better chances of winning.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return (
      response.choices[0]?.message?.content ||
      "Não foi possível gerar uma explicação no momento."
    );
  } catch (error) {
    console.error("Error generating explanation:", error);
    return "Seus números foram selecionados com base em análise estatística de sorteios anteriores. Lembre-se: cada sorteio é independente e aleatório.";
  }
}
