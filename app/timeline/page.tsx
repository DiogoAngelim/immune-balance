"use client";

import { Navigation } from "@/components/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const timeRanges = ["7 days", "30 days", "90 days", "1 year"];

export default function TimelinePage() {
  const [selectedRange, setSelectedRange] = useState(timeRanges[0]);
  const [signals, setSignals] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/reports/signals")
      .then(res => res.json())
      .then(data => setSignals(data));
    fetch("/api/reports/events")
      .then(res => res.json())
      .then(data => setEvents(data));
  }, []);
  const dataLines = {};
  // Helper to get the earliest date allowed for the selected range
  function getRangeStart(range: string) {
    const now = new Date();
    switch (range) {
      case "7 days":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      case "30 days":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      case "90 days":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
      case "1 year":
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      default:
        return new Date(0);
    }
  }

  const rangeStart = getRangeStart(selectedRange);
  function isInRange(item: any) {
    if (!item.date) return false;
    const d = new Date(item.date);
    return d >= rangeStart;
  }
  const signalsInRange = signals.filter(isInRange);
  const eventsInRange = events.filter(isInRange);
  const isEmpty = signalsInRange.length === 0 && eventsInRange.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Timeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your immune signals and events over time</p>
        </div>
        {/* Example range selector, you can adjust placement as needed */}
        {!isEmpty && (
          <div className="mb-6 flex gap-2">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  selectedRange === range
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        )}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mb-4">
              <circle cx="32" cy="32" r="30" stroke="#e0e7ef" strokeWidth="4" />
              <rect x="20" y="28" width="24" height="8" rx="2" fill="#60a5fa" opacity="0.15" />
              <rect x="28" y="32" width="8" height="2" rx="1" fill="#60a5fa" />
            </svg>
            <p className="text-lg font-semibold text-foreground mb-2">No timeline data yet</p>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Upload lab results or log events to see your immune timeline here. Your data will appear as you add it.
            </p>
          </div>
        ) : (
          <>
            {/* Timeline visualization and controls here */}
            {/* ...existing code... */}
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-4 h-4 bg-secondary/30 rounded" />
                <span>Personal baseline range</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-chart-3" />
                <span>Event marker</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
