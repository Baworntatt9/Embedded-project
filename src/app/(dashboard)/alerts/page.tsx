"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/card/EventCard";
import EventVideoModal from "@/components/modal/EventVideoModal";
import { storage } from "@/lib/firebaseClient";
import { ref, listAll, getDownloadURL } from "firebase/storage";

type EventItem = {
  id: number;
  title: string;
  time: string; // HH:mm (local)
  date: string; // YYYY-MM-DD (local)
  type: "motion";
  thumbnail?: string;
  videoUrl: string;
  timestamp: number; // ใช้เรียงและ filter
};

// -----------------------------
// Parse date/time from filename
// Example: evt_20251205_114106_video.mp4
// -----------------------------
function parseFromFileName(fileName: string) {
  const nameNoExt = fileName.replace(/\.[^/.]+$/, "");
  const parts = nameNoExt.split("_");

  if (parts.length < 3) {
    return {
      date: "2025-01-01",
      time: "00:00",
      dateRaw: "20250101",
      timeRaw: "000000",
      timestamp: 0,
    };
  }

  const dateRaw = parts[1]; // 20251205
  const timeRaw = parts[2]; // 114106

  const year = Number(dateRaw.slice(0, 4));
  const month = Number(dateRaw.slice(4, 6)); // 01–12
  const day = Number(dateRaw.slice(6, 8));

  const hour = Number(timeRaw.slice(0, 2));
  const minute = Number(timeRaw.slice(2, 4));
  const second = Number(timeRaw.slice(4, 6));

  // 🕒 สมมติว่า timestamp ในชื่อไฟล์เป็น UTC
  const utcDate = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second)
  );

  // 🇹🇭 ให้ JS แปลงเป็นเวลา local (ไทย +7)
  const localDate = new Date(utcDate);

  // ❌ ห้ามใช้ toISOString() เพราะมันจะกลับไป UTC อีก
  const yyyy = localDate.getFullYear();
  const mm = String(localDate.getMonth() + 1).padStart(2, "0");
  const dd = String(localDate.getDate()).padStart(2, "0");

  const hh = String(localDate.getHours()).padStart(2, "0");
  const min = String(localDate.getMinutes()).padStart(2, "0");

  const date = `${yyyy}-${mm}-${dd}`; // local date
  const time = `${hh}:${min}`; // local time

  return {
    date,
    time,
    dateRaw,
    timeRaw,
    timestamp: localDate.getTime(),
  };
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

            const { date, time, dateRaw, timeRaw, timestamp } =
              parseFromFileName(fileRef.name);

            // หา thumbnail ชื่อเดียวกัน: evt_YYYYMMDD_HHMMSS_image.jpg
            const imgName = `evt_${dateRaw}_${timeRaw}_image.jpg`;
            let thumbnail: string | undefined;

            try {
              thumbnail = await getDownloadURL(
                ref(storage, `DetectMotionLogs/images/${imgName}`)
              );
            } catch {
              thumbnail = undefined;
            }

            return {
              id: i + 1,
              title: "Motion Detected",
              date,
              time,
              thumbnail,
              videoUrl,
              type: "motion",
              timestamp,
            };
          })
        );

        // ใหม่สุด → เก่าสุด
        items.sort((a, b) => b.timestamp - a.timestamp);

        // กรอง 7 วันล่าสุด
        const now = Date.now();
        const last7days = items.filter(
          (e) => now - e.timestamp <= 7 * 24 * 60 * 60 * 1000
        );

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

      {/* Event list */}
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

      {/* Video modal */}
      <EventVideoModal
        open={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
