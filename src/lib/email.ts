import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

interface SendResultEmailParams {
  to: string;
  contestNumber: number;
  drawnNumbers: number[];
  numbers: number[];
  hits: number;
  lotteryType?: string;
}

export async function sendResultEmail({
  to,
  contestNumber,
  drawnNumbers,
  numbers,
  hits,
  lotteryType = "Mega-Sena",
}: SendResultEmailParams): Promise<boolean> {
  if (!resend) {
    console.log("Resend not configured, skipping email");
    return false;
  }

  const prize =
    hits === 6
      ? "🎉 SENA! Parabéns!"
      : hits === 5
      ? "Quina!"
      : hits === 4
      ? "Quadra!"
      : "Você acertou números!";

  try {
    await resend.emails.send({
      from: "MegaPalpite <noreply@megapalpite.com>",
      to,
      subject: `🎰 Resultado ${lotteryType} - Concurso ${contestNumber} - ${hits} acertos!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="background-color: #0a0a0a; color: #fff; font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h1 style="color: #22c55e; text-align: center;">🎰 MegaPalpite</h1>
            
            <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="margin-top: 0;">${lotteryType} - Concurso ${contestNumber}</h2>
              
              <p style="color: #888;">Números sorteados:</p>
              <p style="font-size: 24px; font-family: monospace; text-align: center; color: #22c55e;">
                ${drawnNumbers.map((n) => n.toString().padStart(2, "0")).join(" - ")}
              </p>
            </div>
            
            <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Seu jogo:</h3>
              <p style="font-size: 20px; font-family: monospace; text-align: center;">
                ${numbers.map((n) => n.toString().padStart(2, "0")).join(" - ")}
              </p>
              <p style="text-align: center; font-size: 24px; font-weight: bold; color: ${hits >= 4 ? "#22c55e" : "#888"};">
                ${hits} acertos
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; background-color: ${
              hits >= 4 ? "#22c55e20" : "#1a1a1a"
            }; border-radius: 8px;">
              <p style="font-size: 24px; margin: 0;">${prize}</p>
            </div>
            
            <p style="text-align: center; color: #666; margin-top: 30px; font-size: 12px;">
              Este email foi enviado automaticamente pelo MegaPalpite.<br/>
              Jogue com responsabilidade.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
