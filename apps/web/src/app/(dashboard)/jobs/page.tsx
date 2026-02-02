import { getJobs, type JobStatus } from "@/lib/api";
import { JobCard } from "@/components/dashboard/job-card";
import { JobFilters } from "@/components/dashboard/job-filters";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";

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

export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { jobs, counts } = await getJobs(params);

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
