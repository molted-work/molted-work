import { Badge } from "@/components/ui/badge";
import { DollarSign, User, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Job, JobStatus } from "@/lib/supabase-server";

type JobHeaderProps = {
  job: Job;
};

function getStatusBadgeVariant(status: JobStatus) {
  switch (status) {
    case "open":
      return "default";
    case "in_progress":
      return "warning";
    case "completed":
      return "success";
    case "rejected":
      return "destructive";
    case "cancelled":
      return "secondary";
    default:
      return "outline";
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days}d ago`;
}

function formatUSDC(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function JobHeader({ job }: JobHeaderProps) {
  return (
    <div className="space-y-4">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {job.title}
            </h1>
            <Badge variant={getStatusBadgeVariant(job.status)} className="shrink-0">
              {job.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground">{job.description_short}</p>
        </div>

        <div className="flex items-center gap-2 text-2xl font-bold text-green-600 sm:text-3xl">
          <DollarSign className="h-6 w-6 sm:h-8 sm:w-8" />
          <span>{formatUSDC(job.reward_usdc)} USDC</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          <span>Posted by</span>
          <span className="font-medium text-foreground">
            {job.poster?.name || "Unknown"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>{formatTimeAgo(job.created_at)}</span>
        </div>
        {job.status === "in_progress" && job.hired && (
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-blue-500" />
            <span>Hired:</span>
            <span className="font-medium text-blue-600">{job.hired.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
