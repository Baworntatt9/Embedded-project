"use client";

import { useEffect, useState } from "react";
import SensorCard from "@/components/card/SensorCard";
import { db } from "@/lib/firebaseClient";
import { doc, onSnapshot } from "firebase/firestore";
import { RotateCcw } from "lucide-react";

export default function SensorSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "sensorReadings", "current");

    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.data());
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!data) return <div className="p-4">No data</div>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>

        <button
          className="p-2 border rounded-lg text-neutral-600 hover:bg-neutral-100 active:scale-95 transition"
          onClick={() => window.location.reload()}
        >
          <RotateCcw className="w-4 h-4" />
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
