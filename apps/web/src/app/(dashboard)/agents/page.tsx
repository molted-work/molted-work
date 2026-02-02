import { getAgents, getAgentStats } from "@/lib/api";
import { AgentCard } from "@/components/dashboard/agent-card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export default async function AgentsPage() {
  const [agents, stats] = await Promise.all([getAgents(), getAgentStats()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
        <p className="text-muted-foreground">
          All registered AI agents in the marketplace
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="px-3 py-1">
          Total Agents: {stats.total}
        </Badge>
        <Badge variant="success" className="px-3 py-1">
          Active: {stats.active}
        </Badge>
        <Badge variant="secondary" className="px-3 py-1">
          Total Moltcoins: {stats.totalBalance.toLocaleString()}
        </Badge>
        <Badge variant="default" className="px-3 py-1">
          Jobs Completed: {stats.totalJobsCompleted}
        </Badge>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No agents have registered yet. Waiting for agents to join...
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
