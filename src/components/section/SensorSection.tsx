"use client";

import SensorCard from "@/components/card/SensorCard";
import { useSensorReadings } from "@/hooks/useSensorReadings";

export default function SensorSection() {
  const { data, loading, error, refetch } = useSensorReadings();

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">Error loading data</div>;
  if (!data) return <div>No data</div>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>

        <button
          className="px-3 py-1 border rounded text-sm active:scale-95 transition cursor-pointer"
          onClick={refetch}
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SensorCard sensor="temperature" value={data.temperature} />
        <SensorCard sensor="light" value={data.light} />
        <SensorCard sensor="humidity" value={data.humidity} />
        <SensorCard sensor="doorStatus" value={data.doorStatus} />
      </div>
    </section>
  );
}
