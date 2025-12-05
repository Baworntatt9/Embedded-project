"use client";

import { useEffect, useState } from "react";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebaseClient";
import EventCard from "../card/EventCard";
import EventVideoModal from "../modal/EventVideoModal";

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

// ===============================
// 🔥 Parse จาก filename → Local time
// ===============================
function parseFromFileName(fileName: string) {
  const nameNoExt = fileName.replace(/\.[^/.]+$/, "");
  const parts = nameNoExt.split("_"); // ["evt", "20251205", "114106", "video"]

  if (parts.length < 3) {
    return {
      date: "2025-01-01",
      time: "00:00",
      dateRaw: "20250101",
      timeRaw: "000000",
      timestamp: 0,
    };
  }

  const dateRaw = parts[1]; // YYYYMMDD
  const timeRaw = parts[2]; // HHMMSS

  const year = Number(dateRaw.slice(0, 4));
  const month = Number(dateRaw.slice(4, 6)); // 01–12
  const day = Number(dateRaw.slice(6, 8));

  const hour = Number(timeRaw.slice(0, 2));
  const minute = Number(timeRaw.slice(2, 4));
  const second = Number(timeRaw.slice(4, 6));

  // 🕒 สร้าง Date จาก "UTC" ตามชื่อไฟล์
  const utcDate = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second)
  );

  // 🇹🇭 แปลงเป็น Local (เครื่องผู้ใช้, ไทย = UTC+7)
  const localDate = new Date(utcDate);

  // ❌ ห้ามใช้ toISOString() เพราะมันแสดงวันที่ตาม UTC
  const yyyy = localDate.getFullYear();
  const mm = String(localDate.getMonth() + 1).padStart(2, "0");
  const dd = String(localDate.getDate()).padStart(2, "0");

  const hh = String(localDate.getHours()).padStart(2, "0");
  const min = String(localDate.getMinutes()).padStart(2, "0");

  const date = `${yyyy}-${mm}-${dd}`;
  const time = `${hh}:${min}`;

  return { date, time, dateRaw, timeRaw, timestamp: localDate.getTime() };
}

export default function RecordActivity() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const videosRef = ref(storage, "DetectMotionLogs/videos");
        const listResult = await listAll(videosRef);

        const items: EventItem[] = await Promise.all(
          listResult.items.map(async (videoRef, index) => {
            const fileName = videoRef.name;
            const videoUrl = await getDownloadURL(videoRef);

            const { date, time, dateRaw, timeRaw, timestamp } =
              parseFromFileName(fileName);

            // รูปคู่กัน
            const imgName = `evt_${dateRaw}_${timeRaw}_image.jpg`;
            let thumbUrl: string | undefined;

            try {
              thumbUrl = await getDownloadURL(
                ref(storage, `DetectMotionLogs/images/${imgName}`)
              );
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
              timestamp,
            };
          })
        );

        // 🕒 เรียงใหม่สุด → เก่าสุด ด้วย timestamp
        items.sort((a, b) => b.timestamp - a.timestamp);

        setEvents(items);

        // เลือกวันที่ล่าสุดเป็น default
        if (items.length > 0) {
          setSelectedDate(items[0].date);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading events:", err);
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // 🧹 Filter ตามวันที่
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
              time={event.time} // ใช้เวลา local
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
