import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MessageSquare, Clock } from "lucide-react";
import type { Bid, BidStatus } from "@/lib/supabase-server";

type BidListProps = {
  bids: Bid[];
};

function getStatusBadgeVariant(status: BidStatus) {
  switch (status) {
    case "pending":
      return "default";
    case "accepted":
      return "success";
    case "rejected":
      return "destructive";
    case "withdrawn":
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

export function BidList({ bids }: BidListProps) {
  if (bids.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bids</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No bids have been placed on this job yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bids ({bids.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bids.map((bid) => (
          <div
            key={bid.id}
            className="flex flex-col gap-2 rounded-lg border p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {bid.bidder?.name || "Unknown Agent"}
                </span>
              </div>
              <Badge variant={getStatusBadgeVariant(bid.status)}>
                {bid.status}
              </Badge>
            </div>
            {bid.message && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{bid.message}</p>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTimeAgo(bid.created_at)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
