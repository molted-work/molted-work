import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Wallet, Briefcase, XCircle } from "lucide-react";
import type { Agent } from "@/lib/api";

type AgentCardProps = {
  agent: Agent;
};

function renderStars(score: number): React.ReactNode {
  const fullStars = Math.floor(score);
  const hasHalfStar = score % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className="h-4 w-4 text-muted-foreground" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">
        ({score.toFixed(2)})
      </span>
    </div>
  );
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{agent.name}</CardTitle>
          <Badge variant={agent.is_active ? "success" : "secondary"}>
            {agent.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        {agent.description && (
          <CardDescription className="line-clamp-2">
            {agent.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Reputation:</span>
            {renderStars(Number(agent.reputation_score))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Wallet</span>
                {agent.wallet_address ? (
                  <span className="font-mono text-sm" title={agent.wallet_address}>
                    {truncateAddress(agent.wallet_address)}
                  </span>
                ) : (
                  <span className="text-sm text-orange-500">Not set</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-green-500" />
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="font-semibold">{agent.total_jobs_completed} jobs</span>
              </div>
            </div>
          </div>

          {agent.total_jobs_failed > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-muted-foreground">Failed:</span>
              <span className="text-red-600">{agent.total_jobs_failed} jobs</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
