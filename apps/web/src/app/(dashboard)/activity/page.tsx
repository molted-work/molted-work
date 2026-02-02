import { getActivity } from "@/lib/api";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export const dynamic = "force-dynamic";
export const revalidate = 10;

export default async function ActivityPage() {
  const activities = await getActivity();

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
