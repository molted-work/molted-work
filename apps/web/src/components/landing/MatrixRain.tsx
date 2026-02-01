"use client";

import { useEffect, useRef, useState } from "react";

const MATRIX_CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789<>{}[]|/*-+";
const CHAR_SIZE = 20;

interface MatrixRainProps {
  isAgent: boolean;
}

export function MatrixRain({ isAgent }: MatrixRainProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState<{
    cols: number;
    rows: number;
    chars: string[];
  }>({
    cols: 0,
    rows: 0,
    chars: [],
  });
  const [opacities, setOpacities] = useState<number[]>([]);

  // Calculate grid dimensions based on container size
  useEffect(() => {
    if (!isAgent || !containerRef.current) return;

    const updateGrid = () => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.offsetWidth;
      const height = container.offsetHeight;
      const cols = Math.ceil(width / CHAR_SIZE);
      const rows = Math.ceil(height / CHAR_SIZE);
      const totalCells = cols * rows;

      setGrid({
        cols,
        rows,
        chars: Array.from({ length: totalCells }, () =>
          MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
        ),
      });
      setOpacities(Array(totalCells).fill(0));
    };

    updateGrid();
    window.addEventListener("resize", updateGrid);
    return () => window.removeEventListener("resize", updateGrid);
  }, [isAgent]);

  // Chain animation effect
  useEffect(() => {
    if (!isAgent || grid.cols === 0) return;

    const startChain = () => {
      const col = Math.floor(Math.random() * grid.cols);
      const startRow = Math.floor(Math.random() * Math.max(1, grid.rows - 5));
      const chainLength = 5;
      const delayBetween = 100;

      for (let i = 0; i < chainLength; i++) {
        const row = startRow + i;
        if (row >= grid.rows) break;
        const idx = row * grid.cols + col;

        setTimeout(() => {
          setOpacities((prev) => {
            const next = [...prev];
            if (idx < next.length) next[idx] = 1;
            return next;
          });
        }, i * delayBetween);

        setTimeout(() => {
          setOpacities((prev) => {
            const next = [...prev];
            if (idx < next.length) next[idx] = 0;
            return next;
          });
        }, chainLength * delayBetween + 500 + i * delayBetween);
      }
    };

    const interval = setInterval(startChain, 300);
    for (let i = 0; i < 5; i++) {
      setTimeout(startChain, i * 200);
    }

    return () => clearInterval(interval);
  }, [isAgent, grid.cols, grid.rows]);

  if (!isAgent) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-[1] font-mono leading-none text-green-400"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${grid.cols}, ${CHAR_SIZE}px)`,
        gridTemplateRows: `repeat(${grid.rows}, ${CHAR_SIZE}px)`,
        fontSize: `${CHAR_SIZE * 0.7}px`,
      }}
    >
      {grid.chars.map((char, i) => (
        <span
          key={i}
          className="flex items-center justify-center transition-opacity duration-300"
          style={{
            opacity: opacities[i] * 0.25,
            textShadow:
              opacities[i] > 0.5 ? "0 0 6px rgba(74, 222, 128, 0.5)" : "none",
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
