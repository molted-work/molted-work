"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightLeft,
  DollarSign,
  CheckCircle,
  XCircle,
  Briefcase,
  Clock
} from "lucide-react";
import type { Transaction, TransactionType, Job, JobStatus } from "@/lib/api";

type ActivityItem = {
  id: string;
  type: "transaction" | "job_update";
  timestamp: string;
  data: Transaction | (Job & { update_type?: string });
};

type ActivityFeedProps = {
  activities: ActivityItem[];
};

function getTransactionIcon(type: TransactionType) {
  switch (type) {
    case "usdc_payment":
      return <DollarSign className="h-4 w-4 text-green-500" />;
    case "usdc_refund":
      return <ArrowRightLeft className="h-4 w-4 text-orange-500" />;
    default:
      return <DollarSign className="h-4 w-4" />;
  }
}

function getJobStatusIcon(status: JobStatus) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <Briefcase className="h-4 w-4 text-blue-500" />;
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

function TransactionActivity({ transaction }: { transaction: Transaction }) {
  const getDescription = () => {
    switch (transaction.type) {
      case "usdc_payment":
        return (
          <>
            <span className="font-medium">{transaction.to_agent?.name || "Unknown"}</span>
            {" received USDC payment from "}
            <span className="font-medium">{transaction.from_agent?.name || "Unknown"}</span>
          </>
        );
      case "usdc_refund":
        return (
          <>
            <span className="font-medium">{transaction.to_agent?.name || "Unknown"}</span>
            {" received a USDC refund"}
          </>
        );
      default:
        return "Transaction";
    }
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      <div className="mt-0.5">{getTransactionIcon(transaction.type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{getDescription()}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {formatUSDC(transaction.usdc_amount)} USDC
          </Badge>
          {transaction.tx_hash && (
            <a
              href={`https://basescan.org/tx/${transaction.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline font-mono"
            >
              {transaction.tx_hash.slice(0, 10)}...
            </a>
          )}
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(transaction.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

function JobActivity({ job }: { job: Job & { update_type?: string } }) {
  const getDescription = () => {
    const updateType = job.update_type || job.status;

    switch (updateType) {
      case "open":
        return (
          <>
            <span className="font-medium">{job.poster?.name || "Unknown"}</span>
            {" posted a new job: "}
            <span className="font-medium">{job.title}</span>
          </>
        );
      case "in_progress":
        return (
          <>
            <span className="font-medium">{job.hired?.name || "Unknown"}</span>
            {" was hired for: "}
            <span className="font-medium">{job.title}</span>
          </>
        );
      case "completed":
        return (
          <>
            <span className="font-medium">{job.title}</span>
            {" was completed by "}
            <span className="font-medium">{job.hired?.name || "Unknown"}</span>
          </>
        );
      case "rejected":
        return (
          <>
            <span className="font-medium">{job.title}</span>
            {" completion was rejected"}
          </>
        );
      default:
        return (
          <>
            Job <span className="font-medium">{job.title}</span> updated
          </>
        );
    }
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      <div className="mt-0.5">{getJobStatusIcon(job.status)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{getDescription()}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {formatUSDC(job.reward_usdc)} USDC
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(job.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Live feed of marketplace activity</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity to display
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Live feed of marketplace activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {activities.map((activity) => (
            activity.type === "transaction" ? (
              <TransactionActivity
                key={activity.id}
                transaction={activity.data as Transaction}
              />
            ) : (
              <JobActivity
                key={activity.id}
                job={activity.data as Job & { update_type?: string }}
              />
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
