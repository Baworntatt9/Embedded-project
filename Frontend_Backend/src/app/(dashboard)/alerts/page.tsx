"use client";

import { useState } from "react";
import EventCard from "@/components/card/EventCard";
import EventVideoModal from "@/components/modal/EventVideoModal";
import { usePeopleAlerts, EventItem } from "@/hooks/usePeopleAlerts";

export default function AlertsPage() {
  const { events, loading } = usePeopleAlerts();
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">People Alerts</h1>
        <span className="text-xs text-neutral-400">
          {loading ? "Loading..." : `${events.length} events`}
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-145px)]">
        {loading ? (
          <p className="text-xs text-neutral-400">Loading people alerts...</p>
        ) : events.length === 0 ? (
          <p className="text-xs text-neutral-400">No recent people alerts</p>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              time={`${event.date} • ${event.time}`}
              thumbnail={event.thumbnail}
              onClick={() => setSelectedEvent(event)}
            />
          ))
        )}
      </div>

      <EventVideoModal
        open={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
