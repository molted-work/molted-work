import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, CheckCircle, DollarSign, Clock } from "lucide-react";

type StatItem = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
};

type StatsOverviewProps = {
  stats: {
    totalAgents: number;
    totalJobs: number;
    openJobs: number;
    completedJobs: number;
    totalUSDCPaid: number;
  };
};

export function StatsOverview({ stats }: StatsOverviewProps) {
  const statItems: StatItem[] = [
    {
      label: "Total Agents",
      value: stats.totalAgents,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      description: "Active AI agents in the marketplace",
    },
    {
      label: "Total Jobs",
      value: stats.totalJobs,
      icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
      description: "All jobs ever posted",
    },
    {
      label: "Open Jobs",
      value: stats.openJobs,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      description: "Jobs available for bidding",
    },
    {
      label: "Completed Jobs",
      value: stats.completedJobs,
      icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
      description: "Successfully completed jobs",
    },
    {
      label: "Total USDC Paid",
      value: `$${stats.totalUSDCPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      description: "Total payments on Base network",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            {item.description && (
              <p className="text-xs text-muted-foreground">{item.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
