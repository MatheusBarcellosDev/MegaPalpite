"use client";

import { useEffect, useState } from "react";

interface NumberBallsProps {
  numbers: number[];
  matchedNumbers?: number[];
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export function NumberBalls({
  numbers,
  matchedNumbers = [],
  size = "md",
  animate = false,
}: NumberBallsProps) {
  const [visibleCount, setVisibleCount] = useState(animate ? 0 : numbers.length);

  useEffect(() => {
    if (!animate) {
      setVisibleCount(numbers.length);
      return;
    }

    setVisibleCount(0);
    const intervals: NodeJS.Timeout[] = [];

    numbers.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleCount((prev) => prev + 1);
      }, (index + 1) * 200);
      intervals.push(timeout);
    });

    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [numbers, animate]);

  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg md:w-16 md:h-16 md:text-xl",
    lg: "w-16 h-16 text-xl md:w-20 md:h-20 md:text-2xl",
  };

  const matchedSet = new Set(matchedNumbers);

  return (
    <div className="flex flex-wrap justify-center gap-3 md:gap-4">
      {numbers.map((number, index) => {
        const isMatched = matchedSet.has(number);
        const isVisible = index < visibleCount;

        return (
          <div
            key={`${number}-${index}`}
            className={`
              ${sizeClasses[size]}
              rounded-full flex items-center justify-center font-bold
              transition-all duration-300 transform
              ${
                isMatched
                  ? "bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/40"
                  : "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/40"
              }
              ${isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"}
              ${animate && isVisible ? "animate-number-pop" : ""}
              hover:scale-110 cursor-default
              text-white
            `}
            style={{
              animationDelay: animate ? `${index * 100}ms` : "0ms",
            }}
          >
            {number.toString().padStart(2, "0")}
          </div>
        );
      })}
    </div>
  );
}

interface NumberBallProps {
  number: number;
  isMatched?: boolean;
  size?: "sm" | "md" | "lg";
}

export function NumberBall({
  number,
  isMatched = false,
  size = "md",
}: NumberBallProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center font-bold
        ${
          isMatched
            ? "bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/40"
            : "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/40"
        }
        text-white
      `}
    >
      {number.toString().padStart(2, "0")}
    </div>
  );
}
