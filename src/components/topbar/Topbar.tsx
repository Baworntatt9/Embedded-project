"use client";

import { useRouter } from "next/navigation";
import { Bell, BedDouble } from "lucide-react";

export default function Topbar() {
  const Router = useRouter();

  return (
    <header className="w-full px-4 py-3 bg-neutral-800 text-white flex items-center justify-between">
      {/* Left: Logo + Title */}
      <div
        className="flex items-center gap-2 ml-1 cursor-pointer"
        onClick={() => Router.push("/dashboard")}
      >
        <BedDouble size={22} />
        <span className="text-lg font-medium tracking-wide leading-none translate-y-[0.5px]">
          Onbedded
        </span>
      </div>

      {/* Right: Notification */}
      <button
        className="p-2 rounded-full hover:bg-neutral-700 active:scale-95 transition cursor-pointer"
        onClick={() => Router.push("/alerts")}
      >
        <Bell size={22} />
      </button>
    </header>
  );
}
