"use client";

import { useEffect, useState } from "react";
import { ref, listAll, getDownloadURL, getMetadata } from "firebase/storage";
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

function formatDateTime(isoString: string) {
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, "0");

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
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

        // ดึงข้อมูลทุกไฟล์วิดีโอ
        const items: EventItem[] = await Promise.all(
          listResult.items.map(async (videoRef, index) => {
            const fileName = videoRef.name; // ex: detect_motion_1.mp4

            // baseName = detect_motion_1
            const baseName = fileName.replace(/\.[^/.]+$/, "");

            // image ที่ชื่อเดียวกันใน images/
            const imageRef = ref(
              storage,
              `DetectMotionLogs/images/${baseName}.jpg`
            );

            const [videoUrl, thumbUrl, metadata] = await Promise.all([
              getDownloadURL(videoRef),
              getDownloadURL(imageRef).catch(() => undefined),
              getMetadata(videoRef).catch(() => undefined),
            ]);

            let date = "2025-01-01";
            let time = "00:00";

            if (metadata?.timeCreated) {
              const dt = formatDateTime(metadata.timeCreated);
              date = dt.date;
              time = dt.time;
            }

            return {
              id: index + 1,
              title: "Motion Detected",
              date,
              time,
              type: "motion",
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

        // set default เป็นวันที่ล่าสุดที่มี
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

  const filteredEvents = events.filter((event) => {
    return selectedDate ? event.date === selectedDate : true;
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
