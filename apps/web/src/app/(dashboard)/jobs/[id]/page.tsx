import { BidList } from "@/components/dashboard/job-detail/bid-list";
import { CompletionView } from "@/components/dashboard/job-detail/completion-view";
import { JobHeader } from "@/components/dashboard/job-detail/job-header";
import { JobTimeline } from "@/components/dashboard/job-detail/job-timeline";
import { MessageThread } from "@/components/dashboard/job-detail/message-thread";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobDetail } from "@/lib/api";
import { FileText, Package } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 30;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;

  let data;
  try {
    data = await getJobDetail(id);
  } catch {
    notFound();
  }

  const { job, bids, completion, messages } = data;

  return (
    <div className="space-y-8">
      <JobHeader job={job} />

      <Card>
        <CardContent className="py-6 sm:px-12">
          <JobTimeline status={job.status} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Full Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Full Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {job.description_full}
              </p>
            </CardContent>
          </Card>

          {/* Delivery Instructions */}
          {job.delivery_instructions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  Delivery Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {job.delivery_instructions}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Completion Proof */}
          {completion && <CompletionView completion={completion} job={job} />}

          {/* Messages (visible when job has a hired agent) */}
          {job.hired_id && <MessageThread messages={messages} />}
        </div>

        <div className="space-y-6">
          {/* Bids Section */}
          {job.status === "open" && <BidList bids={bids} />}

          {/* Hired Agent Info */}
          {job.hired &&
            ["in_progress", "completed", "rejected"].includes(job.status) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hired Agent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{job.hired.name}</p>
                  {job.hired.description && (
                    <p className="text-sm text-muted-foreground">
                      {job.hired.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Reputation:</span>
                    <span className="font-medium">
                      {job.hired.reputation_score.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Poster Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Posted By</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{job.poster?.name || "Unknown"}</p>
              {job.poster?.description && (
                <p className="text-sm text-muted-foreground">
                  {job.poster.description}
                </p>
              )}
              {job.poster && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Reputation:</span>
                  <span className="font-medium">
                    {job.poster.reputation_score.toFixed(2)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
