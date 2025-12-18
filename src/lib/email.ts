import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

interface SendResultEmailParams {
  to: string;
  contestNumber: number;
  drawnNumbers: number[];
  userGames: {
    numbers: number[];
    hits: number;
  }[];
}

export async function sendResultEmail({
  to,
  contestNumber,
  drawnNumbers,
  userGames,
}: SendResultEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log("Resend not configured, skipping email");
    return { success: false, error: "Email not configured" };
  }

  const bestResult = Math.max(...userGames.map((g) => g.hits));
  const prize =
    bestResult === 6
      ? "🎉 SENA! Parabéns!"
      : bestResult === 5
      ? "Quina!"
      : bestResult === 4
      ? "Quadra!"
      : "Nenhum prêmio desta vez";

  const gamesHtml = userGames
    .map(
      (game, index) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #333;">Jogo ${index + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #333; font-family: monospace;">
          ${game.numbers.map((n) => n.toString().padStart(2, "0")).join(" - ")}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #333; text-align: center; font-weight: bold; color: ${
          game.hits >= 4 ? "#22c55e" : "#888"
        };">
          ${game.hits} acertos
        </td>
      </tr>
    `
    )
    .join("");

  try {
    await resend.emails.send({
      from: "Mega-Sena Smart <noreply@megasena.app>",
      to,
      subject: `🎰 Resultado Concurso ${contestNumber} - ${bestResult} acertos!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="background-color: #0a0a0a; color: #fff; font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h1 style="color: #22c55e; text-align: center;">🎰 Mega-Sena Smart</h1>
            
            <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Concurso ${contestNumber}</h2>
              
              <p style="color: #888;">Números sorteados:</p>
              <p style="font-size: 24px; font-family: monospace; text-align: center; color: #22c55e;">
                ${drawnNumbers.map((n) => n.toString().padStart(2, "0")).join(" - ")}
              </p>
            </div>
            
            <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Seus jogos:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="color: #888;">
                    <th style="text-align: left; padding: 8px;">Jogo</th>
                    <th style="text-align: left; padding: 8px;">Números</th>
                    <th style="text-align: center; padding: 8px;">Acertos</th>
                  </tr>
                </thead>
                <tbody>
                  ${gamesHtml}
                </tbody>
              </table>
            </div>
            
            <div style="text-align: center; padding: 20px; background-color: ${
              bestResult >= 4 ? "#22c55e20" : "#1a1a1a"
            }; border-radius: 8px;">
              <p style="font-size: 24px; margin: 0;">${prize}</p>
            </div>
            
            <p style="text-align: center; color: #666; margin-top: 30px; font-size: 12px;">
              Este email foi enviado automaticamente pelo Mega-Sena Smart.<br/>
              Jogue com responsabilidade.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}
