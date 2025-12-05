"use client";

import { useEffect, useState } from "react";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebaseClient";
import EventCard from "../card/EventCard";
import EventVideoModal from "../modal/EventVideoModal";

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

export default function RecordActivity() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // โฟลเดอร์ใน Firebase Storage
        const videosRef = ref(storage, "DetectMotionLogs/videos");
        const listResult = await listAll(videosRef);

        const items: EventItem[] = await Promise.all(
          listResult.items.map(async (videoRef, index) => {
            const fileName = videoRef.name; // ex: evt_20251205_114106_video.mp4
            const videoUrl = await getDownloadURL(videoRef);

            // ✅ parse date/time จากชื่อไฟล์
            const { date, time, dateRaw, timeRaw } =
              parseFromFileName(fileName);

            // ✅ รูปที่คู่กัน: evt_20251205_114106_image.jpg
            const imageFileName = `evt_${dateRaw}_${timeRaw}_image.jpg`;
            const imageRef = ref(
              storage,
              `DetectMotionLogs/images/${imageFileName}`
            );

            let thumbUrl: string | undefined;
            try {
              thumbUrl = await getDownloadURL(imageRef);
            } catch {
              thumbUrl = undefined;
            }

            return {
              id: index + 1,
              title: "Motion Detected",
              date,
              time,
              type: "motion" as const,
              thumbnail: thumbUrl,
              videoUrl,
            };
          })
        );

        // เรียงจากใหม่สุดไปเก่าสุด
        items.sort((a, b) => {
          const dA = new Date(`${a.date}T${a.time}:00`).getTime();
          const dB = new Date(`${b.date}T${b.time}:00`).getTime();
          return dB - dA;
        });

        setEvents(items);

        // default: วันล่าสุดที่มี
        if (items.length > 0) {
          setSelectedDate(items[0].date);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading events from storage:", err);
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const filteredEvents = events.filter((event) =>
    selectedDate ? event.date === selectedDate : true
  );

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
        {loading ? (
          <p className="text-xs text-neutral-400">Loading motion logs...</p>
        ) : filteredEvents.length === 0 ? (
          <p className="text-xs text-neutral-400">No motion detected</p>
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
