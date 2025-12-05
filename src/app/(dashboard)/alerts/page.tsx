import EventCard from "@/components/card/EventCard";

type EventItem = {
  id: number;
  title: string;
  time: string; // HH:mm
  date: string; // YYYY-MM-DD
  type: "motion";
  thumbnail?: string;
};

export default function AlertsPage() {
  // มีแต่ motion อย่างเดียว
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
      date: "2025-10-29",
      time: "14:20",
      type: "motion",
    },
    {
      id: 4,
      title: "Motion Detected",
      date: "2025-10-28",
      time: "07:30",
      type: "motion",
    },
    {
      id: 5,
      title: "Motion Detected",
      date: "2025-10-28",
      time: "07:30",
      type: "motion",
    },
    {
      id: 6,
      title: "Motion Detected",
      date: "2025-10-28",
      time: "07:30",
      type: "motion",
    },
    {
      id: 7,
      title: "Motion Detected",
      date: "2025-10-28",
      time: "07:30",
      type: "motion",
    },
  ];

  const filteredEvents = mockEvents; // ไม่มี filter เพราะมีเฉพาะ motion อยู่แล้ว

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Motion Alerts</h1>
        <span className="text-xs text-neutral-400">
          {filteredEvents.length} events
        </span>
      </div>

      {/* List */}
      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-145px)]">
        {filteredEvents.length === 0 ? (
          <p className="text-xs text-neutral-400">No motion detected</p>
        ) : (
          filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              time={`${event.date} • ${event.time}`}
              thumbnail={event.thumbnail}
            />
          ))
        )}
      </div>
    </div>
  );
}
