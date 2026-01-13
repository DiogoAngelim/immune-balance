import { cn } from "@/lib/utils";

interface StatusMessageProps {
  status: "stable" | "recovery" | "activation" | "loading" | "empty";
  className?: string;
}

const statusConfig = {
  stable: {
    message: "Currently stable",
    description: "Your immune patterns are within your usual range over the past week.",
    dotColor: "bg-chart-2",
  },
  recovery: {
    message: "In a recovery phase",
    description: "Your system is returning toward baseline after recent activity.",
    dotColor: "bg-chart-3",
  },
  activation: {
    message: "Showing sustained activation",
    description: "Some signals have been elevated recently. This is normal after certain events.",
    dotColor: "bg-chart-1",
  },
};

export function StatusMessage({ status, className }: StatusMessageProps) {
  const config = statusConfig[status];

  if (!config) {
    // Fallback for loading/empty states or unknown status
    let fallbackMessage = "";
    let fallbackDescription = "";
    if (status === "loading") {
      fallbackMessage = "Loading...";
      fallbackDescription = "Please wait while we load your timeline.";
    } else if (status === "empty") {
      fallbackMessage = "No data available";
      fallbackDescription = "No events in this range.";
    } else {
      fallbackMessage = "Unknown status";
      fallbackDescription = "No description available.";
    }
    return (
      <div className={cn("rounded-xl bg-card border border-border p-6", className)}>
        <div className="flex items-center gap-3 mb-2">
          <div className={cn("w-2.5 h-2.5 rounded-full bg-muted")} />
          <h2 className="text-xl font-semibold text-foreground">{fallbackMessage}</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{fallbackDescription}</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl bg-card border border-border p-6", className)}>
      <div className="flex items-center gap-3 mb-2">
        <div className={cn("w-2.5 h-2.5 rounded-full", config.dotColor)} />
        <h2 className="text-xl font-semibold text-foreground">{config.message}</h2>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{config.description}</p>
    </div>
  );
}
