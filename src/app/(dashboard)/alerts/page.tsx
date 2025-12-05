"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/card/EventCard";
import EventVideoModal from "@/components/modal/EventVideoModal";
import { storage } from "@/lib/firebaseClient";
import { ref, listAll, getDownloadURL } from "firebase/storage";

type EventItem = {
  id: number;
  title: string;
  time: string; // HH:mm
  date: string; // YYYY-MM-DD
  type: "motion";
  thumbnail?: string;
  videoUrl: string;
};

// จากชื่อไฟล์แบบ evt_20251205_114106_video.mp4
function parseFromFileName(fileName: string) {
  const nameNoExt = fileName.replace(/\.[^/.]+$/, ""); // evt_20251205_114106_video
  const parts = nameNoExt.split("_"); // ["evt","20251205","114106","video"]

  if (parts.length < 4) {
    return {
      date: "2025-01-01",
      time: "00:00",
      dateRaw: "20250101",
      timeRaw: "000000",
    };
  }

  const dateRaw = parts[1]; // 20251205
  const timeRaw = parts[2]; // 114106

  const date = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(
    6,
    8
  )}`; // 2025-12-05
  const time = `${timeRaw.slice(0, 2)}:${timeRaw.slice(2, 4)}`; // 11:41

  return { date, time, dateRaw, timeRaw };
}

export default function AlertsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const videosRef = ref(storage, "DetectMotionLogs/videos");
        const listResult = await listAll(videosRef);

        const items: EventItem[] = await Promise.all(
          listResult.items.map(async (fileRef, i) => {
            const videoUrl = await getDownloadURL(fileRef);

            // ✅ ดึง date/time จากชื่อไฟล์
            const { date, time, dateRaw, timeRaw } = parseFromFileName(
              fileRef.name
            );

            // ✅ สร้างชื่อรูปที่คู่กัน: evt_20251205_114106_image.jpg
            const imageFileName = `evt_${dateRaw}_${timeRaw}_image.jpg`;

            let thumbUrl: string | undefined;
            try {
              thumbUrl = await getDownloadURL(
                ref(storage, `DetectMotionLogs/images/${imageFileName}`)
              );
            } catch {
              thumbUrl = undefined;
            }

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
        const now = Date.now();
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
              onClick={() => setSelectedEvent(event)}
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
