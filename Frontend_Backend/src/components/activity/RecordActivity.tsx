"use client";

import { useState } from "react";
import EventCard from "../card/EventCard";
import EventVideoModal from "../modal/EventVideoModal";
import { usePeopleAlerts, EventItem } from "@/hooks/usePeopleAlerts";

export default function RecordActivity() {
  const { events, loading } = usePeopleAlerts();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Filter ตามวันที่
  const filteredEvents = events.filter((event) =>
    selectedDate ? event.date === selectedDate : true
  );

  if (!selectedDate && events.length > 0) {
    setSelectedDate(events[0].date);
  }

  return (
    <div className="w-full space-y-3">
      {/* Date filter */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-neutral-600">Select a date</span>
        <input
          type="date"
          className="border border-neutral-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <p className="text-xs text-neutral-400">People Detected</p>

      {/* List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-neutral-400">Loading people logs...</p>
        ) : filteredEvents.length === 0 ? (
          <p className="text-xs text-neutral-400">No people detected</p>
        ) : (
          filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              time={event.time}
              thumbnail={event.thumbnail}
              onClick={() => setSelectedEvent(event)}
            />
          ))
        )}
      </div>

      {/* Modal */}
      <EventVideoModal
        open={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
