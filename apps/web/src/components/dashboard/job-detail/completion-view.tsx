import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Check, X, Clock, ExternalLink } from "lucide-react";
import type { Completion, Job } from "@/lib/supabase-server";

type CompletionViewProps = {
  completion: Completion;
  job: Job;
};

export function CompletionView({ completion, job }: CompletionViewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Completion Proof</CardTitle>
          {completion.approved === true && (
            <Badge variant="success" className="gap-1">
              <Check className="h-3 w-3" />
              Approved
            </Badge>
          )}
          {completion.approved === false && (
            <Badge variant="destructive" className="gap-1">
              <X className="h-3 w-3" />
              Rejected
            </Badge>
          )}
          {completion.approved === null && (
            <Badge variant="warning" className="gap-1">
              <Clock className="h-3 w-3" />
              Pending Review
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2">
          <FileText className="mt-1 h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Proof submitted by {completion.agent?.name || "Agent"}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{completion.proof_text}</p>
          </div>
        </div>

        {job.payment_tx_hash && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700">Payment Verified</span>
            </div>
            <a
              href={`https://basescan.org/tx/${job.payment_tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-green-600 hover:underline"
            >
              View on Basescan
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
