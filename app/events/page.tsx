"use client";

import { Navigation } from "@/components/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Plus, Syringe, Bug, Brain, Moon, X } from "lucide-react";

const eventTypes = [
  { id: "infection", label: "I had an infection", icon: Bug },
  { id: "vaccine", label: "I received a vaccine", icon: Syringe },
  { id: "stress", label: "High stress period", icon: Brain },
  { id: "sleep", label: "Poor sleep", icon: Moon },
];

interface Event {
  id?: string;
  type: string;
  date: string;
  notes?: string;
}


import { useEffect } from "react";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [eventNotes, setEventNotes] = useState("");

  useEffect(() => {
    fetch("/api/reports/events")
      .then(res => res.json())
      .then(data => setEvents(data));
  }, []);

  const handleAddEvent = async () => {
    if (!selectedType || !eventDate) return;

    const newEvent: Event = {
      type: selectedType,
      date: eventDate,
      notes: eventNotes || undefined,
    };

    // Save to backend
    await fetch("/api/reports/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvent),
    });
    // Refresh events from backend
    fetch("/api/reports/events")
      .then(res => res.json())
      .then(data => setEvents(data));

    setIsAdding(false);
    setSelectedType(null);
    setEventDate("");
    setEventNotes("");
  };

  const handleDeleteEvent = async (id: string) => {
    // Remove from backend
    await fetch(`/api/reports/events?id=${id}`, {
      method: "DELETE",
    });
    // Refresh events from backend
    fetch("/api/reports/events")
      .then(res => res.json())
      .then(data => setEvents(data));
  };

  const getEventType = (typeId: string) => eventTypes.find((t) => t.id === typeId);

  // Capitalize a string (first letter only)
  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Recent Events</h1>
            <p className="text-sm text-muted-foreground mt-1">Log events that may explain patterns in your data</p>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add event
            </Button>
          )}
        </div>

        {isAdding && (
          <div className="rounded-xl bg-card border border-border p-6 mb-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Log a new event</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {eventTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                    selectedType === type.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                  )}
                >
                  <type.icon
                    className={cn("w-6 h-6", selectedType === type.id ? "text-primary" : "text-muted-foreground")}
                  />
                  <span
                    className={cn(
                      "text-xs text-center",
                      selectedType === type.id ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {type.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">When did this occur?</label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <input
                      type="text"
                      value={eventDate}
                      readOnly
                      placeholder="e.g., Jan 5, 2026 or Jan 5-7, 2026"
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                      onClick={() => setCalendarOpen(true)}
                    />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="p-0 w-auto">
                    <Calendar
                      mode="single"
                      selected={eventDate ? new Date(eventDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setEventDate(date.toISOString().slice(0, 10));
                          setCalendarOpen(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  placeholder="Any additional details"
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleAddEvent} disabled={!selectedType || !eventDate}>
                Save event
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setSelectedType(null);
                  setEventDate("");
                  setEventNotes("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}


        {/* Robust Events Rendering */}
        <div className="space-y-3">
          {/* Debug: console.log('Events array:', events) */}
          {events.map((event, idx) => {
            const eventType = getEventType(event.type);
            // Use generic icon for OpenAI/dynamic events
            const GenericIcon = () => (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="#94a3b8" strokeWidth="2" fill="#f1f5f9" />
                <path d="M10 6v4l3 2" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            );

            // Format all events the same way
            return (
              <div key={event.id ? event.id : idx} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border group">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  {eventType ? (
                    <eventType.icon className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <GenericIcon />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {eventType ? capitalize(eventType.label) : capitalize(event.type || "Event")}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{event.date}</span>
                    {event.notes && (
                      <>
                        <span>·</span>
                        <span className="truncate">{event.notes}</span>
                      </>
                    )}
                  </div>
                </div>
                {event.id && (
                  <button
                    onClick={() => handleDeleteEvent(event.id!)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-foreground transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mb-4">
              <circle cx="32" cy="32" r="30" stroke="#e0e7ef" strokeWidth="4" />
              <path d="M20 44 Q32 28 44 44" stroke="#60a5fa" strokeWidth="2.5" fill="none" />
              <circle cx="26" cy="32" r="2.5" fill="#60a5fa" />
              <circle cx="38" cy="32" r="2.5" fill="#60a5fa" />
            </svg>
            <p className="text-lg font-semibold text-foreground mb-2">No events logged yet</p>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Events help explain patterns in your immune data. Log your first event to get started!
            </p>
            <Button onClick={() => setIsAdding(true)} className="mt-2">Log an Event</Button>
          </div>
        )}
      </main>
    </div>
  );
}
