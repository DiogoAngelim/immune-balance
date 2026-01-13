"use client";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import { StatusMessage } from "@/components/status-message";
import { StatusIndicator } from "@/components/status-indicator";

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

interface Event {
  id?: string;
  type?: string;
  date?: string;
  notes?: string;
  description?: string;
}

export default function OverviewPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const hasPatterns = signals.length > 0;
  const hasEvents = events.length > 0;

  useEffect(() => {
    fetch("/api/reports/signals")
      .then(res => res.json())
      .then(data => setSignals(data));
    fetch("/api/reports/events")
      .then(res => res.json())
      .then(data => setEvents(data));
  }, []);

  // Categorize signals
  const inflammatorySignals = signals.filter(s => /crp|wbc|inflamm|neutrophil|esr|ferritin|il-6/i.test(s.name));
  const regulatorySignals = signals.filter(s => /regulat|il-10|treg|tgf/i.test(s.name));
  const recoverySignals = signals.filter(s => s.status === "returning");
  const usualSignals = signals.filter(s => s.status === "usual");
  const elevatedSignals = signals.filter(s => s.status === "elevated");

  // StatusIndicator values
  const inflammatoryValue = inflammatorySignals.length ? Math.round((inflammatorySignals.filter(s => s.status === "elevated").length / inflammatorySignals.length) * 100) : 0;
  const regulatoryValue = regulatorySignals.length ? Math.round((regulatorySignals.filter(s => s.status === "elevated").length / regulatorySignals.length) * 100) : 0;
  const recoveryValue = recoverySignals.length;
  const stabilityValue = signals.length ? Math.round((usualSignals.length / signals.length) * 100) : 0;

  // PatternItems: show latest in each category
  const latestInflammatory = inflammatorySignals[inflammatorySignals.length - 1];
  const latestRegulatory = regulatorySignals[regulatorySignals.length - 1];
  const latestRecovery = recoverySignals[recoverySignals.length - 1];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Immune Balance Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Observing your immune patterns over time</p>
        </div>

        {(!hasPatterns && !hasEvents) ? null : (
          <StatusMessage status="stable" className="mb-8" />
        )}

        {(!hasPatterns && !hasEvents) ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-6">
              <circle cx="40" cy="40" r="38" stroke="#e0e7ef" strokeWidth="4" />
              <path d="M25 55 Q40 35 55 55" stroke="#60a5fa" strokeWidth="3" fill="none" />
              <circle cx="32" cy="38" r="3" fill="#60a5fa" />
              <circle cx="48" cy="38" r="3" fill="#60a5fa" />
            </svg>
            <h2 className="text-lg font-semibold text-foreground mb-2">Welcome to Immune Balance!</h2>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Start by uploading your first lab results or logging an event. Your immune patterns and events will appear here as you add data.
            </p>
            <div className="flex gap-4">
              <a href="/data" className="px-4 py-2 rounded bg-primary text-primary-foreground font-medium shadow hover:bg-primary/90 transition">Upload Lab Results</a>
              <a href="/events" className="px-4 py-2 rounded bg-secondary text-secondary-foreground font-medium shadow hover:bg-secondary/90 transition">Log an Event</a>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusIndicator label="Inflammatory activity" status={inflammatoryValue > 50 ? "slightly elevated" : "within your usual range"} value={inflammatoryValue} color="teal" />
              <StatusIndicator label="Regulatory signals" status={regulatoryValue > 50 ? "slightly elevated recently" : "within your usual range"} value={regulatoryValue} color="blue" />
              <StatusIndicator label="Recovery speed" status={recoveryValue > 0 ? "returning toward baseline" : "within your usual range"} value={recoveryValue} color="amber" />
              <StatusIndicator label="Stability over time" status={stabilityValue > 80 ? "within your usual range" : "variable"} value={stabilityValue} color="slate" />
            </div>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl bg-card border border-border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-sm text-muted-foreground mb-0">This section shows the latest trend for each immune pattern based on your most recent results.</p>
                  <h3 className="text-sm font-medium text-foreground">Recent patterns</h3>
                </div>
                <div className="space-y-3">
                  <PatternItem
                    label="Inflammatory messenger"
                    detail={latestInflammatory ? `${latestInflammatory.name}: ${latestInflammatory.status}` : "No recent data"}
                    trend={latestInflammatory ? (latestInflammatory.status === "elevated" ? "up" : latestInflammatory.status === "returning" ? "down" : "stable") : "stable"}
                  />
                  <PatternItem
                    label="Regulatory activity"
                    detail={latestRegulatory ? `${latestRegulatory.name}: ${latestRegulatory.status}` : "No recent data"}
                    trend={latestRegulatory ? (latestRegulatory.status === "elevated" ? "up" : latestRegulatory.status === "returning" ? "down" : "stable") : "stable"}
                  />
                  <PatternItem
                    label="Recovery markers"
                    detail={latestRecovery ? `${latestRecovery.name}: ${latestRecovery.status}` : "No recent data"}
                    trend={latestRecovery ? (latestRecovery.status === "elevated" ? "up" : latestRecovery.status === "returning" ? "down" : "stable") : "stable"}
                  />
                </div>
              </div>
              <div className="rounded-xl bg-card border border-border p-6">
                <h3 className="text-sm font-medium text-foreground mb-4">Recent events</h3>
                <div className="space-y-3">
                  {events.slice(0, 3).map((event, idx) => (
                    <EventItem
                      key={event.id || idx}
                      label={event.type || "Event"}
                      date={event.date || ""}
                      detail={event.description || ""}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function PatternItem({
  label,
  detail,
  trend,
}: {
  label: string
  detail: string
  trend: "up" | "down" | "stable"
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <div className="flex items-center gap-2">
        {trend === "stable" && <div className="w-8 h-1 bg-chart-2 rounded-full" />}
        {trend === "up" && (
          <svg className="w-4 h-4 text-chart-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
        {trend === "down" && (
          <svg className="w-4 h-4 text-chart-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
    </div>
  );
}

function EventItem({
  label,
  date,
  detail,
}: {
  label: string
  date: string
  detail: string
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <div className="w-2 h-2 rounded-full bg-chart-3 mt-1.5 shrink-0" />
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
