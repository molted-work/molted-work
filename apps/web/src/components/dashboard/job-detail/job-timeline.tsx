import type { JobStatus } from "@/lib/api";
import { Check, Circle, Clock, X } from "lucide-react";

type JobTimelineProps = {
  status: JobStatus;
};

type Step = {
  name: string;
  status: "complete" | "current" | "upcoming" | "failed";
};

function getSteps(jobStatus: JobStatus): Step[] {
  switch (jobStatus) {
    case "open":
      return [
        { name: "Posted", status: "complete" },
        { name: "Bidding", status: "current" },
        { name: "In Progress", status: "upcoming" },
        { name: "Completed", status: "upcoming" },
      ];
    case "in_progress":
      return [
        { name: "Posted", status: "complete" },
        { name: "Hired", status: "complete" },
        { name: "In Progress", status: "current" },
        { name: "Completed", status: "upcoming" },
      ];
    case "completed":
      return [
        { name: "Posted", status: "complete" },
        { name: "Hired", status: "complete" },
        { name: "Work Done", status: "complete" },
        { name: "Completed", status: "complete" },
      ];
    case "rejected":
      return [
        { name: "Posted", status: "complete" },
        { name: "Hired", status: "complete" },
        { name: "Submitted", status: "complete" },
        { name: "Rejected", status: "failed" },
      ];
    case "cancelled":
      return [
        { name: "Posted", status: "complete" },
        { name: "Cancelled", status: "failed" },
      ];
    default:
      return [];
  }
}

function StepIcon({ status }: { status: Step["status"] }) {
  switch (status) {
    case "complete":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
          <Check className="h-4 w-4 text-white" />
        </div>
      );
    case "current":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
          <Clock className="h-4 w-4 text-white" />
        </div>
      );
    case "failed":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
          <X className="h-4 w-4 text-white" />
        </div>
      );
    default:
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background">
          <Circle className="h-3 w-3 text-muted-foreground" />
        </div>
      );
  }
}

export function JobTimeline({ status }: JobTimelineProps) {
  const steps = getSteps(status);

  return (
    <div className="flex items-center pb-6">
      {steps.map((step, index) => (
        <div
          key={step.name}
          className="flex flex-1 items-center last:flex-none"
        >
          <div className="relative flex flex-col items-center">
            <StepIcon status={step.status} />
            <span
              className={`absolute top-full mt-2 whitespace-nowrap text-xs font-medium ${
                step.status === "complete"
                  ? "text-green-400"
                  : step.status === "current"
                  ? "text-white"
                  : step.status === "failed"
                  ? "text-red-600"
                  : "text-muted-foreground"
              }`}
            >
              {step.name}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`mx-3 h-0.5 flex-1 ${
                steps[index + 1].status === "upcoming"
                  ? "bg-muted"
                  : "bg-green-500"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
