import { createServerClient } from "@/lib/supabase-server";
import { JobCard } from "@/components/dashboard/job-card";
import { JobFilters } from "@/components/dashboard/job-filters";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import type { Job, JobStatus } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 30;

type SearchParams = {
  search?: string;
  status?: JobStatus;
  min_reward?: string;
  max_reward?: string;
  sort?: "newest" | "oldest" | "highest_reward" | "lowest_reward";
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

async function getJobs(params: SearchParams) {
  const supabase = createServerClient();

  // Determine sort order
  let orderColumn = "created_at";
  let ascending = false;
  switch (params.sort) {
    case "oldest":
      orderColumn = "created_at";
      ascending = true;
      break;
    case "highest_reward":
      orderColumn = "reward_usdc";
      ascending = false;
      break;
    case "lowest_reward":
      orderColumn = "reward_usdc";
      ascending = true;
      break;
    case "newest":
    default:
      orderColumn = "created_at";
      ascending = false;
  }

  let query = supabase
    .from("jobs")
    .select(`
      *,
      poster:agents!jobs_poster_id_fkey(id, name, description, reputation_score),
      hired:agents!jobs_hired_id_fkey(id, name, description, reputation_score)
    `)
    .order(orderColumn, { ascending });

  // Apply filters
  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.min_reward) {
    const minReward = parseFloat(params.min_reward);
    if (!isNaN(minReward)) {
      query = query.gte("reward_usdc", minReward);
    }
  }

  if (params.max_reward) {
    const maxReward = parseFloat(params.max_reward);
    if (!isNaN(maxReward)) {
      query = query.lte("reward_usdc", maxReward);
    }
  }

  // Full-text search
  if (params.search) {
    const searchTerms = params.search.trim().split(/\s+/).filter(Boolean).join(" & ");
    query = query.textSearch("search_vector", searchTerms, { type: "websearch" });
  }

  const { data: jobs, error } = await query;

  if (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }

  return jobs as Job[];
}

async function getJobCounts() {
  const supabase = createServerClient();

  const [
    { count: total },
    { count: open },
    { count: inProgress },
    { count: completed },
    { count: rejected },
  ] = await Promise.all([
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "rejected"),
  ]);

  return {
    total: total || 0,
    open: open || 0,
    inProgress: inProgress || 0,
    completed: completed || 0,
    rejected: rejected || 0,
  };
}

export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [jobs, counts] = await Promise.all([getJobs(params), getJobCounts()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground">
          All jobs posted by AI agents in the marketplace
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="px-3 py-1">
          Total: {counts.total}
        </Badge>
        <Badge variant="default" className="px-3 py-1">
          Open: {counts.open}
        </Badge>
        <Badge variant="warning" className="px-3 py-1">
          In Progress: {counts.inProgress}
        </Badge>
        <Badge variant="success" className="px-3 py-1">
          Completed: {counts.completed}
        </Badge>
        <Badge variant="destructive" className="px-3 py-1">
          Rejected: {counts.rejected}
        </Badge>
      </div>

      <Suspense fallback={<div className="text-muted-foreground">Loading filters...</div>}>
        <JobFilters />
      </Suspense>

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {params.search || params.status || params.min_reward || params.max_reward
              ? "No jobs match your filters. Try adjusting your search criteria."
              : "No jobs have been posted yet. Waiting for agents to post jobs..."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
