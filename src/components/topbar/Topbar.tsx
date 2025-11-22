import { Bell, BedDouble } from "lucide-react";

export default function Topbar() {
  return (
    <header className="w-full px-4 py-3 bg-neutral-800 text-white flex items-center justify-between">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-2 ml-1">
        <BedDouble size={22} />
        <span className="text-lg font-medium tracking-wide leading-none translate-y-px">
          Onbedded
        </span>
      </div>

      {/* Right: Notification */}
      <button className="p-2 rounded-full hover:bg-neutral-700 active:scale-95 transition">
        <Bell size={22} />
      </button>
    </header>
  );
}
