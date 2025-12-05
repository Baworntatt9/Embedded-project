"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/card/EventCard";
import EventVideoModal from "@/components/modal/EventVideoModal";
import { storage } from "@/lib/firebaseClient";
import { ref, listAll, getDownloadURL, getMetadata } from "firebase/storage";

type EventItem = {
  id: number;
  title: string;
  time: string; // HH:mm
  date: string; // YYYY-MM-DD
  type: "motion";
  thumbnail?: string;
  videoUrl: string;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export default function AlertsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null); // 👈 state สำหรับ modal

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const videosRef = ref(storage, "DetectMotionLogs/videos");
        const listResult = await listAll(videosRef);

        const items: EventItem[] = await Promise.all(
          listResult.items.map(async (fileRef, i) => {
            const videoUrl = await getDownloadURL(fileRef);
            const metadata = await getMetadata(fileRef);

            const baseName = fileRef.name.replace(/\.[^/.]+$/, "");

            let thumbUrl: string | undefined;
            try {
              thumbUrl = await getDownloadURL(
                ref(storage, `DetectMotionLogs/images/${baseName}.jpg`)
              );
            } catch {
              thumbUrl = undefined;
            }

            const { date, time } = metadata.timeCreated
              ? formatDateTime(metadata.timeCreated)
              : { date: "2025-01-01", time: "00:00" };

            return {
              id: i + 1,
              title: "Motion Detected",
              date,
              time,
              type: "motion" as const,
              thumbnail: thumbUrl,
              videoUrl,
            };
          })
        );

        // เรียงใหม่สุด → เก่าสุด
        items.sort((a, b) => {
          const aT = new Date(`${a.date}T${a.time}`).getTime();
          const bT = new Date(`${b.date}T${b.time}`).getTime();
          return bT - aT;
        });

        // กรอง 7 วันล่าสุด
        const now = new Date().getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        const last7days = items.filter((e) => {
          const t = new Date(`${e.date}T${e.time}`).getTime();
          return now - t <= sevenDays;
        });

        setEvents(last7days);
        setLoading(false);
      } catch (e) {
        console.error("Error loading alerts:", e);
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Motion Alerts</h1>
        <span className="text-xs text-neutral-400">
          {loading ? "Loading..." : `${events.length} events`}
        </span>
      </div>

      {/* List */}
      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-145px)]">
        {loading ? (
          <p className="text-xs text-neutral-400">Loading motion alerts...</p>
        ) : events.length === 0 ? (
          <p className="text-xs text-neutral-400">No recent motion alerts</p>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              time={`${event.date} • ${event.time}`}
              thumbnail={event.thumbnail}
              onClick={() => setSelectedEvent(event)} // 👈 สำคัญ
            />
          ))
        )}
      </div>

      {/* Modal แสดงวิดีโอ */}
      <EventVideoModal
        open={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
