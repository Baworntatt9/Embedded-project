import { useEffect, useState, useCallback } from "react";
import { SensorReading } from "@/types/SensorReading";

export function useSensorReadings() {
  const [data, setData] = useState<SensorReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/sensor");
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const json = await res.json();

      const formatted: SensorReading = {
        temperature: json.temperature ?? null,
        humidity: json.humidity ?? null,
        light: json.light ?? null,
        doorStatus: json.doorStatus ?? null,
      };

      setData(formatted);
    } catch (err) {
      console.error("Error fetching /api/sensor", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
