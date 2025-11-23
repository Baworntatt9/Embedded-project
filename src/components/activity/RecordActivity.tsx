import { useState } from "react";
import EventCard from "../card/EventCard";

type EventType = "motion" | "sound" | "delivery";

type EventItem = {
  id: number;
  title: string;
  time: string; // HH:mm
  date: string; // YYYY-MM-DD
  type: EventType;
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
    title: "Sound Detected",
    date: "2025-10-31",
    time: "19:02",
    type: "sound",
  },
  {
    id: 4,
    title: "Package Delivered",
    date: "2025-10-30",
    time: "16:45",
    type: "delivery",
  },
  {
    id: 5,
    title: "Sound Detected",
    date: "2025-10-30",
    time: "09:12",
    type: "sound",
  },
];

export default function RecordActivity() {
  // default เอาวันแรกใน
  const [selectedDate, setSelectedDate] = useState<string>("2025-10-31");
  const [selectedType, setSelectedType] = useState<EventType | "all">("all");

  const filteredEvents = mockEvents.filter((event) => {
    const matchDate = event.date === selectedDate;
    const matchType = selectedType === "all" || event.type === selectedType;
    return matchDate && matchType;
  });

  return (
    <div className="w-full space-y-3">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 mb-2">
        {/* Date filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Select a date</span>
          <input
            type="date"
            className="border border-neutral-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          <select
            className="border border-neutral-200 rounded-lg px-3 py-1 text-sm bg-white "
            value={selectedType}
            onChange={(e) =>
              setSelectedType(e.target.value as EventType | "all")
            }
          >
            <option value="all">All</option>
            <option value="motion">Motion</option>
            <option value="sound">Sound</option>
            <option value="delivery">Package delivered</option>
          </select>
        </div>
      </div>

      {/* Section title */}
      <p className="text-xs text-neutral-400">
        {selectedType === "motion"
          ? "Motion Detected"
          : selectedType === "sound"
          ? "Sound Detected"
          : selectedType === "delivery"
          ? "Package Delivered"
          : "Activities"}
      </p>

      {/* List of cards */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <p className="text-xs text-neutral-400">
            No activity for this filter
          </p>
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
