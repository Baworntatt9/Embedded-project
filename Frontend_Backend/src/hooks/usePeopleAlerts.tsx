"use client";

import { useEffect, useState } from "react";
import { storage } from "@/lib/firebaseClient";
import { ref, listAll, getDownloadURL } from "firebase/storage";

export type EventItem = {
  id: number;
  title: string;
  time: string;
  date: string;
  type: "motion";
  thumbnail?: string;
  videoUrl: string;
  timestamp: number;
};

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

  const dateRaw = parts[1];
  const timeRaw = parts[2];

  const year = Number(dateRaw.slice(0, 4));
  const month = Number(dateRaw.slice(4, 6));
  const day = Number(dateRaw.slice(6, 8));

  const hour = Number(timeRaw.slice(0, 2));
  const minute = Number(timeRaw.slice(2, 4));
  const second = Number(timeRaw.slice(4, 6));

  const utcDate = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second)
  );
  const localDate = new Date(utcDate);

  const yyyy = localDate.getFullYear();
  const mm = String(localDate.getMonth() + 1).padStart(2, "0");
  const dd = String(localDate.getDate()).padStart(2, "0");
  const hh = String(localDate.getHours()).padStart(2, "0");
  const min = String(localDate.getMinutes()).padStart(2, "0");

  const date = `${yyyy}-${mm}-${dd}`;
  const time = `${hh}:${min}`;

  return {
    date,
    time,
    dateRaw,
    timeRaw,
    timestamp: localDate.getTime(),
  };
}

export function usePeopleAlerts() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const videosRef = ref(storage, "DetectMotionLogs/videos");
      const listResult = await listAll(videosRef);

      const items: EventItem[] = await Promise.all(
        listResult.items.map(async (videoRef, index) => {
          const fileName = videoRef.name;
          const videoUrl = await getDownloadURL(videoRef);

          const { date, time, dateRaw, timeRaw, timestamp } =
            parseFromFileName(fileName);

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

      items.sort((a, b) => b.timestamp - a.timestamp);
      setEvents(items);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const timer = setInterval(fetchEvents, 5000); // poll ทุก 5 วิ
    return () => clearInterval(timer);
  }, []);

  return { events, loading };
}
