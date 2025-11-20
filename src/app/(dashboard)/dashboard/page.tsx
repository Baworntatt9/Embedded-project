"use client";

import { useSensorReadings } from "@/hooks/useSensorReadings";

export default function SensorPage() {
  const { data, loading, error, refetch } = useSensorReadings();

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">Error loading data</div>;
  if (!data) return <div>No data</div>;

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold">Sensor Data</h1>

      <button className="px-3 py-1 border rounded" onClick={refetch}>
        Refresh
      </button>

      <div className="border rounded p-4 space-y-1">
        <div>Temperature: {data.temperature} °C</div>
        <div>Humidity: {data.humidity} %</div>
        <div>Light: {data.light} lux</div>
        <div>Door Status: {data.doorStatus ? "Open" : "Close"}</div>
      </div>
    </div>
  );
}
