import { useState } from "react";
import EventCard from "../card/EventCard";

type EventItem = {
  id: number;
  title: string;
  time: string; // HH:mm
  date: string; // YYYY-MM-DD
  type: "motion";
  thumbnail?: string;
};

const mockEvents: EventItem[] = [
  {
    id: 1,
    title: "Motion Detected",
    date: "2025-10-31",
    time: "21:30",
    type: "motion",
  },
  {
    id: 2,
    title: "Motion Detected",
    date: "2025-10-31",
    time: "20:15",
    type: "motion",
  },
  {
    id: 3,
    title: "Motion Detected",
    date: "2025-10-30",
    time: "19:02",
    type: "motion",
  },
];

export default function RecordActivity() {
  // ค่า default เป็นวันล่าสุดที่มีใน mockEvents
  const [selectedDate, setSelectedDate] = useState<string>("2025-10-31");

  // เหลือแค่ filter by date
  const filteredEvents = mockEvents.filter((event) => {
    return event.date === selectedDate;
  });

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

      {/* Section title */}
      <p className="text-xs text-neutral-400">Motion Detected</p>

      {/* List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <p className="text-xs text-neutral-400">No motion detected</p>
        ) : (
          filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              time={event.time}
              thumbnail={event.thumbnail}
            />
          ))
        )}
      </div>
    </div>
  );
}
