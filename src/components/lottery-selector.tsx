"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface LotteryOption {
  type: string;
  name: string;
  shortName: string;
  icon: string;
  primaryColor: string;
}

const LOTTERY_OPTIONS: LotteryOption[] = [
  {
    type: "megasena",
    name: "Mega-Sena",
    shortName: "Mega",
    icon: "🍀",
    primaryColor: "#22c55e",
  },
  {
    type: "lotofacil",
    name: "Lotofácil",
    shortName: "Lotofácil",
    icon: "🎯",
    primaryColor: "#ec4899",
  },
  {
    type: "quina",
    name: "Quina",
    shortName: "Quina",
    icon: "🎲",
    primaryColor: "#8b5cf6",
  },
];

interface LotterySelectorProps {
  selectedLottery: string;
  onSelect: (lottery: string) => void;
}

export function LotterySelector({ selectedLottery, onSelect }: LotterySelectorProps) {
  const selected = LOTTERY_OPTIONS.find(l => l.type === selectedLottery) || LOTTERY_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[160px] justify-between">
          <span className="flex items-center gap-2">
            <span>{selected.icon}</span>
            <span>{selected.name}</span>
          </span>
          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {LOTTERY_OPTIONS.map((lottery) => (
          <DropdownMenuItem
            key={lottery.type}
            onClick={() => onSelect(lottery.type)}
            className="cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>{lottery.icon}</span>
              <span>{lottery.name}</span>
            </span>
            {lottery.type === selectedLottery && (
              <span className="ml-auto text-emerald-500">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Export the options for use in other components
export { LOTTERY_OPTIONS };
export type { LotteryOption };
