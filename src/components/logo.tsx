"use client";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function Logo({ size = "md", showTagline = true }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: "text-lg", tagline: "text-[8px]" },
    md: { icon: 40, text: "text-xl", tagline: "text-[10px]" },
    lg: { icon: 56, text: "text-2xl", tagline: "text-xs" },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      {/* Geometric Network Icon */}
      <div 
        className="relative"
        style={{ width: s.icon, height: s.icon }}
      >
        <svg 
          viewBox="0 0 60 60" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Grid lines */}
          <line x1="10" y1="10" x2="50" y2="10" stroke="#22c55e" strokeWidth="1.5" />
          <line x1="10" y1="30" x2="50" y2="30" stroke="#22c55e" strokeWidth="1.5" />
          <line x1="10" y1="50" x2="50" y2="50" stroke="#22c55e" strokeWidth="1.5" />
          <line x1="10" y1="10" x2="10" y2="50" stroke="#22c55e" strokeWidth="1.5" />
          <line x1="30" y1="10" x2="30" y2="50" stroke="#22c55e" strokeWidth="1.5" />
          <line x1="50" y1="10" x2="50" y2="50" stroke="#22c55e" strokeWidth="1.5" />
          
          {/* Diagonal connections */}
          <line x1="10" y1="10" x2="30" y2="30" stroke="#22c55e" strokeWidth="1.5" />
          <line x1="50" y1="10" x2="30" y2="30" stroke="#22c55e" strokeWidth="1.5" />
          <line x1="10" y1="50" x2="30" y2="30" stroke="#22c55e" strokeWidth="1.5" />
          <line x1="50" y1="50" x2="30" y2="30" stroke="#22c55e" strokeWidth="1.5" />
          <line x1="10" y1="30" x2="30" y2="10" stroke="#22c55e" strokeWidth="1.5" />
          <line x1="50" y1="30" x2="30" y2="50" stroke="#22c55e" strokeWidth="1.5" />
          
          {/* Corner nodes - green */}
          <circle cx="10" cy="10" r="5" fill="#22c55e" />
          <circle cx="50" cy="10" r="5" fill="#22c55e" />
          <circle cx="10" cy="50" r="5" fill="#22c55e" />
          <circle cx="50" cy="50" r="5" fill="#22c55e" />
          
          {/* Middle nodes - gold/yellow */}
          <circle cx="30" cy="10" r="4" fill="#eab308" />
          <circle cx="30" cy="50" r="4" fill="#eab308" />
          <circle cx="10" cy="30" r="4" fill="#eab308" />
          <circle cx="50" cy="30" r="4" fill="#eab308" />
          
          {/* Center node - dark green */}
          <circle cx="30" cy="30" r="6" fill="#166534" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col">
        <div className={`${s.text} font-bold leading-tight tracking-tight`}>
          <span className="text-emerald-500">MEGA</span>
          <span className="text-gray-300">PALPITE</span>
        </div>
        {showTagline && (
          <span className={`${s.tagline} text-gray-500 tracking-wider`}>
            Análise Estatística Transparente
          </span>
        )}
      </div>
    </div>
  );
}
