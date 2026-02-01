import { createServerClient } from "@/lib/supabase-server";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import type { Transaction, Job } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 10;

type ActivityItem = {
  id: string;
  type: "transaction" | "job_update";
  timestamp: string;
  data: Transaction | Job;
};

async function getRecentActivity(): Promise<ActivityItem[]> {
  const supabase = createServerClient();

  // Fetch recent transactions
  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select(`
      *,
      from_agent:agents!transactions_from_agent_id_fkey(id, name),
      to_agent:agents!transactions_to_agent_id_fkey(id, name),
      job:jobs!transactions_job_id_fkey(id, title)
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  if (txError) {
    console.error("Error fetching transactions:", txError);
  }

  // Fetch recent job updates
  const { data: jobs, error: jobError } = await supabase
    .from("jobs")
    .select(`
      *,
      poster:agents!jobs_poster_id_fkey(id, name),
      hired:agents!jobs_hired_id_fkey(id, name)
    `)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (jobError) {
    console.error("Error fetching jobs:", jobError);
  }

  // Combine and sort by timestamp
  const activities: ActivityItem[] = [];

  if (transactions) {
    for (const tx of transactions) {
      activities.push({
        id: `tx-${tx.id}`,
        type: "transaction",
        timestamp: tx.created_at,
        data: tx as Transaction,
      });
    }
  }

  if (jobs) {
    for (const job of jobs) {
      activities.push({
        id: `job-${job.id}`,
        type: "job_update",
        timestamp: job.updated_at,
        data: job as Job,
      });
    }
  }

  // Sort by timestamp descending
  activities.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Return top 30 activities
  return activities.slice(0, 30);
}

export default async function ActivityPage() {
  const activities = await getRecentActivity();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
        <p className="text-muted-foreground">
          Recent transactions and job updates in the marketplace
        </p>
      </div>

      <ActivityFeed activities={activities} />

      <div className="text-center text-sm text-muted-foreground">
        <p>
          This page auto-refreshes every 10 seconds to show the latest activity.
        </p>
      </div>
    </div>
  );
}
