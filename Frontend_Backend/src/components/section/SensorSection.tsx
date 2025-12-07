// "use client";

// import { useEffect, useState } from "react";
// import SensorCard from "@/components/card/SensorCard";
// import { db } from "@/lib/firebaseClient";
// import { doc, onSnapshot, updateDoc } from "firebase/firestore";
// import { RotateCcw } from "lucide-react";

// export default function SensorSection() {
//   const [data, setData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const ref = doc(db, "sensorReadings", "current");

//     const unsub = onSnapshot(
//       ref,
//       (snapshot) => {
//         if (snapshot.exists()) {
//           setData(snapshot.data());
//         }
//         setLoading(false);
//       },
//       (error) => {
//         console.error("Firestore error:", error);
//         setLoading(false);
//       }
//     );

//     return () => unsub();
//   }, []);

//   const handleToggleControlDoor = async () => {
//     if (!data) return;

//     const current = Boolean(data.controlDoor); // true = locked, false = unlocked
//     const newValue = !current;

//     try {
//       // เขียนลง Firestore
//       await updateDoc(doc(db, "sensorReadings", "current"), {
//         controlDoor: newValue,
//       });
//     } catch (err) {
//       console.error("Failed to update controlDoor:", err);
//     }
//   };

//   if (loading) return <div className="p-4">Loading...</div>;
//   if (!data) return <div className="p-4">No data</div>;

//   return (
//     <section className="space-y-4">
//       <div className="flex items-center justify-between">
//         <h1 className="text-xl font-semibold">Dashboard</h1>

//         <button
//           className="p-2 border rounded-lg text-neutral-600 hover:bg-neutral-100 active:scale-95 transition"
//           onClick={() => window.location.reload()}
//         >
//           <RotateCcw className="w-4 h-4" />
//         </button>
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         <SensorCard sensor="temperature" value={data.temperature} />
//         <SensorCard sensor="light" value={data.light} />
//         <SensorCard sensor="humidity" value={data.humidity} />
//         <SensorCard sensor="doorStatus" value={data.doorStatus} />
//         <div className="col-span-2">
//           <SensorCard
//             sensor="controlDoor"
//             value={data.controlDoor}
//             onToggle={handleToggleControlDoor}
//           />
//         </div>
//       </div>
//     </section>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import SensorCard from "@/components/card/SensorCard";
import { db } from "@/lib/firebaseClient";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { RotateCcw } from "lucide-react";

type SensorData = {
  temperature: number | null;
  humidity: number | null;
  light: number | null; // ADC 0–4095
  doorStatus: boolean | null;
};

type LockData = {
  controlLockDoor: boolean | null; // คำสั่งที่เราส่งไปให้ ESP32
  lockStatus: "Locked" | "Unlocked" | null; // สถานะจริงจาก ESP32
};

export default function SensorSection() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [lockData, setLockData] = useState<LockData | null>(null);

  const [loadingSensor, setLoadingSensor] = useState(true);
  const [loadingLock, setLoadingLock] = useState(true);

  // ------------------------------
  // 1) Subscribe sensorReadings/current
  // ------------------------------
  useEffect(() => {
    const ref = doc(db, "sensorReadings", "current");

    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSensorData({
            temperature: data.temperature ?? null,
            humidity: data.humidity ?? null,
            light: data.light ?? null,
            doorStatus: data.doorStatus ?? null,
          });
        } else {
          setSensorData(null);
        }
        setLoadingSensor(false);
      },
      (error) => {
        console.error("sensorReadings error:", error);
        setLoadingSensor(false);
      }
    );

    return () => unsub();
  }, []);

  // ------------------------------
  // 2) Subscribe controlDoor/current
  // ------------------------------
  useEffect(() => {
    const ref = doc(db, "controlDoor", "current");

    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setLockData({
            controlLockDoor: data.controlLockDoor ?? null,
            lockStatus: data.lockStatus ?? null,
          });
        } else {
          setLockData(null);
        }
        setLoadingLock(false);
      },
      (error) => {
        console.error("controlDoor error:", error);
        setLoadingLock(false);
      }
    );

    return () => unsub();
  }, []);

  // ------------------------------
  // 3) Toggle lock -> อัปเดตเฉพาะ controlLockDoor
  // ------------------------------
  const handleToggleLock = async () => {
    if (!lockData) return;

    const newValue = !Boolean(lockData.controlLockDoor);

    try {
      await updateDoc(doc(db, "controlDoor", "current"), {
        controlLockDoor: newValue,
      });
    } catch (err) {
      console.error("Failed to update controlLockDoor:", err);
    }
  };

  // ------------------------------
  // 4) Render
  // ------------------------------
  if (loadingSensor || loadingLock)
    return <div className="p-4">Loading...</div>;

  if (!sensorData || !lockData) return <div className="p-4">No data</div>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>

        <button
          className="p-2 border rounded-lg text-neutral-600 hover:bg-neutral-100 active:scale-95 transition cursor-pointer"
          onClick={() => window.location.reload()}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Sensor readings */}
        <SensorCard sensor="temperature" value={sensorData.temperature} />
        <SensorCard sensor="light" value={sensorData.light} />
        <SensorCard sensor="humidity" value={sensorData.humidity} />
        <SensorCard sensor="doorStatus" value={sensorData.doorStatus} />

        {/* Lock control */}
        <div className="col-span-2">
          <SensorCard
            sensor="controlDoor"
            value={lockData.controlLockDoor} // คำสั่ง (true = สั่ง Lock)
            lockStatus={lockData.lockStatus} // สถานะจริงจาก ESP32
            onToggle={handleToggleLock}
          />
        </div>
      </div>
    </section>
  );
}
