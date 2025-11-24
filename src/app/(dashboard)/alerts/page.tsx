import EventCard from "@/components/card/EventCard";

type EventType = "motion" | "sound" | "delivery";

type EventItem = {
  id: number;
  title: string;
  time: string; // HH:mm
  date: string; // YYYY-MM-DD
  type: EventType;
  thumbnail?: string;
};

//TestTest

export default function AlertsPage() {
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
    {
      id: 6,
      title: "Motion Detected",
      date: "2025-10-29",
      time: "14:20",
      type: "motion",
    },
    {
      id: 7,
      title: "Package Delivered",
      date: "2025-10-29",
      time: "10:00",
      type: "delivery",
    },
    {
      id: 8,
      title: "Sound Detected",
      date: "2025-10-28",
      time: "08:45",
      type: "sound",
    },
    {
      id: 9,
      title: "Motion Detected",
      date: "2025-10-28",
      time: "07:30",
      type: "motion",
    },
    {
      id: 10,
      title: "Package Delivered",
      date: "2025-10-27",
      time: "18:15",
      type: "delivery",
    },
  ];
  const filteredEvents = mockEvents;

  // ตอนใช้จริงจะแสดงแค่ 7 วันล่าสุด
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Alerts</h1>
        <span className="text-xs text-neutral-400">
          {filteredEvents.length} events
        </span>
      </div>

      {/* List */}
      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-145px)]">
        {filteredEvents.length === 0 ? (
          <p className="text-xs text-neutral-400">No alerts at the moment</p>
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
