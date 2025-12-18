import { AlertTriangle } from "lucide-react";

interface DisclaimerProps {
  variant?: "inline" | "footer" | "card";
}

export function Disclaimer({ variant = "inline" }: DisclaimerProps) {
  const text =
    "Esta aplicação não garante ganhos. Sorteios de loteria são aleatórios e independentes.";

  if (variant === "footer") {
    return (
      <div className="border-t border-border bg-card/50 py-4 px-6">
        <div className="container mx-auto flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          <p>{text}</p>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-500">
              Aviso Importante
            </p>
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
      <p>{text}</p>
    </div>
  );
}
