"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface FrequencyData {
  number: number;
  frequency: number;
  percentage: number;
}

interface FrequencyChartProps {
  data: FrequencyData[];
  title?: string;
}

export function FrequencyChart({ data, title = "Frequência dos Números" }: FrequencyChartProps) {
  // Sort by number for display
  const sortedByNumber = [...data].sort((a, b) => a.number - b.number);
  
  // Get max frequency for color scaling
  const maxFreq = Math.max(...data.map((d) => d.frequency));
  const minFreq = Math.min(...data.map((d) => d.frequency));

  // Color function based on frequency
  const getColor = (frequency: number) => {
    const ratio = (frequency - minFreq) / (maxFreq - minFreq);
    if (ratio > 0.7) return "#22c55e"; // Green - hot
    if (ratio > 0.4) return "#eab308"; // Yellow - medium
    return "#3b82f6"; // Blue - cold
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedByNumber} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="number" 
              stroke="#888" 
              tick={{ fontSize: 10 }}
              interval={4}
            />
            <YAxis stroke="#888" tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
              formatter={(value) => [`${value} vezes`, "Frequência"]}
              labelFormatter={(label) => `Número ${label}`}
            />
            <Bar dataKey="frequency" radius={[2, 2, 0, 0]}>
              {sortedByNumber.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.frequency)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-muted-foreground">Quente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span className="text-muted-foreground">Médio</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-muted-foreground">Frio</span>
        </div>
      </div>
    </div>
  );
}

interface TopNumbersProps {
  hotNumbers: { number: number; frequency: number }[];
  coldNumbers: { number: number; lastSeen: number }[];
}

export function TopNumbersLists({ hotNumbers, coldNumbers }: TopNumbersProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Top Hot */}
      <div className="p-4 rounded-lg bg-card border border-border">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <span className="text-green-500">●</span>
          Top 10 Mais Frequentes
        </h4>
        <div className="space-y-2">
          {hotNumbers.slice(0, 10).map((item, index) => (
            <div key={item.number} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-4">{index + 1}.</span>
                <span className="font-mono font-bold">{item.number.toString().padStart(2, "0")}</span>
              </div>
              <span className="text-muted-foreground">{item.frequency} vezes</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Cold */}
      <div className="p-4 rounded-lg bg-card border border-border">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <span className="text-blue-500">●</span>
          Top 10 Mais Atrasados
        </h4>
        <div className="space-y-2">
          {coldNumbers.slice(0, 10).map((item, index) => (
            <div key={item.number} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-4">{index + 1}.</span>
                <span className="font-mono font-bold">{item.number.toString().padStart(2, "0")}</span>
              </div>
              <span className="text-muted-foreground">{item.lastSeen} sorteios atrás</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
