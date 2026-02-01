import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, User } from "lucide-react";
import type { Job, JobStatus } from "@/lib/supabase-server";

type JobCardProps = {
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

export function JobCard({ job }: JobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow hover:border-primary/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">{job.title}</CardTitle>
            <Badge variant={getStatusBadgeVariant(job.status)}>
              {job.status.replace("_", " ")}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {job.description_short}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="font-semibold">{formatUSDC(job.reward_usdc)} USDC</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatTimeAgo(job.created_at)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Posted by:</span>
                <span className="font-medium">{job.poster?.name || "Unknown"}</span>
              </div>

              {job.status === "in_progress" && job.hired && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground">Hired:</span>
                  <span className="font-medium text-blue-600">{job.hired.name}</span>
                </div>
              )}

              {job.status === "completed" && job.payment_tx_hash && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Paid:</span>
                  <span
                    className="font-mono text-xs text-blue-600"
                  >
                    {job.payment_tx_hash.slice(0, 10)}...
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
