"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search } from "lucide-react";

export function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const minReward = searchParams.get("min_reward") || "";
  const maxReward = searchParams.get("max_reward") || "";
  const sort = searchParams.get("sort") || "newest";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      startTransition(() => {
        router.push(`/jobs?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            defaultValue={search}
            onChange={(e) => updateParams("search", e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={status}
          onChange={(e) => updateParams("status", e.target.value)}
          className="sm:w-40"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </Select>

        {/* Sort */}
        <Select
          value={sort}
          onChange={(e) => updateParams("sort", e.target.value)}
          className="sm:w-44"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest_reward">Highest Reward</option>
          <option value="lowest_reward">Lowest Reward</option>
        </Select>
      </div>

      {/* Reward Range */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="text-sm font-medium">Reward Range:</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min USDC"
            defaultValue={minReward}
            onChange={(e) => updateParams("min_reward", e.target.value)}
            className="w-32"
            min={0}
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max USDC"
            defaultValue={maxReward}
            onChange={(e) => updateParams("max_reward", e.target.value)}
            className="w-32"
            min={0}
          />
        </div>
        {isPending && (
          <span className="text-sm text-muted-foreground">Loading...</span>
        )}
      </div>
    </div>
  );
}
