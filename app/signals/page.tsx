"use client";


import { Navigation } from "@/components/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { KNOWN_SIGNALS } from "@/lib/known-signals";
import { Button } from "@/components/ui/button";

// Signal interface (shared with app/page.tsx)
interface Signal {
  id?: string;
  name: string;
  technicalName?: string;
  explanation?: string;
  interpretation?: string;
  rawValue?: string;
  measurementMethod?: string;
  status: "usual" | "elevated" | "returning";
}

// Local status config for signals
const statusConfig: Record<string, { label: string; color: string }> = {
  usual: { label: "Usual", color: "bg-gray-300" },
  elevated: { label: "Elevated", color: "bg-red-500" },
  returning: { label: "Returning", color: "bg-yellow-400" },
};




export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  // For optimistic UI update
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSignals = () => {
    fetch("/api/reports/signals")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch signals");
        return res.json();
      })
      .then(data => {
        // Use the real id from the backend
        const signalsWithId: Signal[] = (data || []).map((signal: any) => {
          // Ensure id is present and is a number
          return { ...signal, id: signal.id };
        });
        setSignals(signalsWithId);
      })
      .catch(err => {
        console.error("Error fetching signals:", err);
      });
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  // Delete handler
  const handleDeleteSignal = async (signalId: string) => {
    setDeleting(signalId);
    try {
      const res = await fetch(`/api/reports/signals?id=${signalId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      // Refresh signals
      fetchSignals();
    } catch (err) {
      // Optionally show error toast
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Signals</h1>
          <p className="text-sm text-muted-foreground mt-1">Your immune signals explained in plain language</p>
        </div>

        <div className="space-y-4">
          {signals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mb-4">
                <circle cx="32" cy="32" r="30" stroke="#e0e7ef" strokeWidth="4" />
                <rect x="24" y="28" width="16" height="8" rx="2" fill="#60a5fa" opacity="0.15" />
                <rect x="28" y="32" width="8" height="2" rx="1" fill="#60a5fa" />
              </svg>
              <p className="text-lg font-semibold text-foreground mb-2">No signals detected yet</p>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Upload lab results to see your immune signals here. Your detected signals will appear as you add data.
              </p>
            </div>
          ) : (
            signals.map((signal, idx) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                isExpanded={expandedSignal === String(signal.id)}
                onToggle={() => setExpandedSignal(expandedSignal === String(signal.id) ? null : String(signal.id))}
                onDelete={() => handleDeleteSignal(String(signal.id))}
                deleting={deleting === String(signal.id)}
              />
            ))
          )}
        </div>

        {/* ...existing code... */}
      </main>
    </div>
  );
}

function SignalCard({
  signal,
  isExpanded,
  onToggle,
  onDelete,
  deleting = false,
}: {
  signal: Signal
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
  deleting?: boolean
}) {
  const status = statusConfig[signal.status] || { label: "Unknown", color: "bg-gray-300" };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden group flex items-center p-6">
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", status.color)} />
              </div>
              <h3 className="text-lg font-medium text-foreground">{signal.name}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("px-2 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground")}>
              {status.label}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{signal.explanation}</p>

        <Button
          onClick={onToggle}
          variant="ghost"
          size="sm"
          className="mt-4 flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <span>Hide details</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Learn more</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </Button>

        {isExpanded && (
          <div className="px-6 pb-6 pt-2 border-t border-border bg-secondary/20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Technical name</p>
                <p className="text-sm text-foreground">{signal.technicalName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Raw value</p>
                <p className="text-sm font-mono text-foreground">{signal.rawValue}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Measurement method</p>
                <p className="text-sm text-foreground">{signal.measurementMethod}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <Button
        onClick={onDelete}
        variant="ghost"
        size="icon-sm"
        className={cn(
          "ml-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity",
          deleting && "opacity-50 pointer-events-none"
        )}
        title="Remove signal"
        aria-label="Remove signal"
        disabled={deleting}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
