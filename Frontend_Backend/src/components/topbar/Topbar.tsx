"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, BedDouble } from "lucide-react";
import { toast } from "react-toastify";
import { usePeopleAlerts } from "@/hooks/usePeopleAlerts";

const LAST_SEEN_KEY = "peopleAlerts_lastSeen";

export default function Topbar() {
  const router = useRouter();
  const { events, loading } = usePeopleAlerts();

  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = useRef(0); // ไว้เทียบว่า unread เพิ่มขึ้นไหม

  // คำนวณ unread ตาม lastSeen ใน localStorage
  useEffect(() => {
    if (loading) return;
    if (typeof window === "undefined") return;

    const lastSeenStr = window.localStorage.getItem(LAST_SEEN_KEY);
    const lastSeen = lastSeenStr ? Number(lastSeenStr) : 0;

    const count = events.filter((e) => e.timestamp > lastSeen).length;
    setUnreadCount(count);
  }, [events, loading]);

  useEffect(() => {
    if (loading) return;

    if (unreadCount > prevUnreadRef.current && unreadCount > 0) {
      toast.info("🔔 People detected!", {
        position: "top-left",
        autoClose: 5000,
      });
    }

    prevUnreadRef.current = unreadCount;
  }, [unreadCount, loading]);

  // กดแล้ว mark ว่าอ่านหมด
  const handleAlertsClick = () => {
    if (typeof window !== "undefined") {
      const latestTimestamp =
        events.length > 0 ? events[0].timestamp : Date.now();
      window.localStorage.setItem(LAST_SEEN_KEY, String(latestTimestamp));
    }

    setUnreadCount(0);
    router.push("/alerts");
  };

  const displayCount =
    unreadCount > 9 ? "9+" : unreadCount > 0 ? unreadCount.toString() : "";

  return (
    <header className="w-full px-4 py-3 bg-neutral-800 text-white flex items-center justify-between">
      {/* Left: Logo + Title */}
      <div
        className="flex items-center gap-2 ml-1 cursor-pointer"
        onClick={() => router.push("/dashboard")}
      >
        <BedDouble size={22} />
        <span className="text-lg font-medium tracking-wide leading-none translate-y-[0.5px]">
          Onbedded
        </span>
      </div>

      {/* Right: Notification */}
      <button
        className="p-2 rounded-full hover:bg-neutral-700 active:scale-95 transition cursor-pointer"
        onClick={handleAlertsClick}
      >
        <div className="relative">
          <Bell size={22} />

          {!loading && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold leading-none border border-neutral-800">
              {displayCount}
            </span>
          )}
        </div>
      </button>
    </header>
  );
}
