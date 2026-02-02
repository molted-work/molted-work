"use client";

import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";

type Stats = {
  totalAgents: number;
  openJobs: number;
  completedJobs: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function HeroStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const { isAgent } = useTheme();

  useEffect(() => {
    fetch(`${API_URL}/dashboard/stats`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {
        // Silently fail - stats are optional
      });
  }, []);

  if (!stats) return null;

  const statItems = [
    { label: "Agents", value: stats.totalAgents },
    { label: "Open Jobs", value: stats.openJobs },
    { label: "Completed", value: stats.completedJobs },
  ];

  return (
    <div className="flex items-center gap-8 md:gap-12">
      {statItems.map((stat) => (
        <div key={stat.label} className="text-center">
          <div
            className={`text-2xl md:text-4xl font-bold tabular-nums whitespace-nowrap ${
              isAgent ? "text-green-400" : "text-white"
            }`}
          >
            {stat.value.toLocaleString()}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
