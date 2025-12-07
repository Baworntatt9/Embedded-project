import {
  Thermometer,
  Lightbulb,
  Droplets,
  DoorOpen,
  DoorClosed,
  Lock,
  Unlock,
} from "lucide-react";
import { JSX } from "react";

type SensorType =
  | "temperature"
  | "humidity"
  | "light"
  | "doorStatus"
  | "controlDoor";

type SensorCardProps = {
  sensor: SensorType;
  value: any; // ใช้ number/boolean แล้วแต่ sensor
  onToggle?: () => void;

  // ใช้เฉพาะกับ controlDoor: สถานะจริงจาก ESP32 / Firebase
  lockStatus?: "Locked" | "Unlocked" | null;
};

type StatusLevel = "normal" | "warning" | "critical";

type SensorConfig = {
  label: string;
  unit: string;
  displayValue: string;
  icon: JSX.Element;
  statusLabel: string;
  statusLevel: StatusLevel;
  isLoading?: boolean; // แสดงวงกลมหมุนตอน in-progress
};

export default function SensorCard({
  sensor,
  value,
  onToggle,
  lockStatus,
}: SensorCardProps) {
  const config = getSensorConfig(sensor, value, lockStatus);

  // สำหรับ controlDoor: isLocked ใช้จาก "คำสั่ง" (controlLockDoor)
  const isLocked = sensor === "controlDoor" ? Boolean(value) : false;

  return (
    <div className="relative w-full flex bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* left color bar */}
      <div
        className={`w-2 rounded-l-2xl ${getStatusColor(config.statusLevel)}`}
      />

      {/* content */}
      <div className="flex-1 p-4 flex flex-col gap-3 pb-10">
        {/* top row: icon + badge */}
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
            {config.icon}
          </div>

          {config.statusLabel && (
            <span
              className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(
                config.statusLevel
              )}`}
            >
              {config.statusLabel}
            </span>
          )}
        </div>

        {/* label */}
        <p className="text-sm text-neutral-500">{config.label}</p>

        {/* value + unit + loading */}
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold">
              {config.displayValue}
            </span>

            {config.unit && (
              <span className="text-sm text-neutral-400">{config.unit}</span>
            )}
          </div>

          {/* วงกลมหมุนตอนกำลัง Lock/Unlock / in-progress */}
          {config.isLoading && (
            <span className="inline-block h-4 w-4 rounded-full border-2 border-neutral-300 border-t-transparent animate-spin" />
          )}
        </div>
      </div>

      {/* toggle bottom-right */}
      {sensor === "controlDoor" && onToggle && (
        <button
          type="button"
          onClick={() => void onToggle()}
          className="absolute bottom-4 right-4 inline-flex items-center"
        >
          <span
            className={`
              w-11 h-6 rounded-full p-0.5 flex items-center transition-colors
              ${isLocked ? "bg-emerald-500" : "bg-neutral-300"}
            `}
          >
            <span
              className={`
                w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform
                ${isLocked ? "translate-x-5" : "translate-x-0"}
              `}
            />
          </span>
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------
   CONFIG
--------------------------------------------------- */
function getSensorConfig(
  sensor: SensorType,
  rawValue: number | boolean | null,
  lockStatus?: "Locked" | "Unlocked" | null
): SensorConfig {
  // doorStatus = ประตูเปิด/ปิด
  if (sensor === "doorStatus") {
    const isOpen = Boolean(rawValue);
    return {
      label: "Door Status",
      unit: "",
      displayValue: isOpen ? "Closed" : "Open",
      icon: isOpen ? (
        <DoorClosed size={20} className="text-orange-500" />
      ) : (
        <DoorOpen size={20} className="text-orange-500" />
      ),
      statusLabel: "",
      statusLevel: isOpen ? "normal" : "warning",
    };
  }

  // controlDoor = คุม lock + แสดงสถานะจาก lockStatus
  if (sensor === "controlDoor") {
    const commandLocked = Boolean(rawValue); // controlLockDoor (true = สั่งให้ Lock)

    const normalizedStatus = lockStatus ? lockStatus.toLowerCase() : null; // "locked" / "unlocked"
    const statusLocked = normalizedStatus === "locked";

    // inProgress = ถ้า status ยังไม่มี หรือ status กับ command ขัดกัน
    const inProgress = !lockStatus || statusLocked !== commandLocked;

    let displayValue: string;
    let statusLabel: string;
    let statusLevel: StatusLevel;

    if (inProgress) {
      displayValue = commandLocked ? "Locking..." : "Unlocking...";
      statusLabel = "In progress";
      statusLevel = "warning";
    } else {
      displayValue = statusLocked ? "Locked" : "Unlocked";
      statusLabel = statusLocked ? "Secure" : "Not Locked";
      statusLevel = statusLocked ? "normal" : "warning";
    }

    // icon: ใช้สถานะจริง ถ้ามี lockStatus, ไม่งั้น fallback ตาม command
    const showLockedIcon = lockStatus != null ? statusLocked : commandLocked;

    return {
      label: "Door Lock Control",
      unit: "",
      displayValue,
      icon: showLockedIcon ? (
        <Lock size={20} className="text-orange-500" />
      ) : (
        <Unlock size={20} className="text-orange-500" />
      ),
      statusLabel,
      statusLevel,
      isLoading: inProgress,
    };
  }

  // sensor ปกติอื่น ๆ: temperature / light / humidity
  const value = typeof rawValue === "number" ? rawValue : 0;

  // Temperature
  if (sensor === "temperature") {
    let status: StatusLevel = "normal";
    let label = "Normal";

    if (value < 18) {
      status = "warning";
      label = "Cold";
    } else if (value > 36) {
      status = "critical";
      label = "Critical";
    } else if (value > 32) {
      status = "warning";
      label = "Hot";
    }

    return {
      label: "Temperature",
      unit: "°C",
      displayValue: value.toFixed(1),
      icon: <Thermometer size={20} className="text-orange-500" />,
      statusLabel: label,
      statusLevel: status,
    };
  }

  // Light: raw ADC 0–4095, 0 = bright, 4095 = dark
  if (sensor === "light") {
    const lux = typeof rawValue === "number" ? rawValue : 0;

    let status: StatusLevel = "normal";
    let label = "Normal";

    if (lux < 150) {
      status = "warning";
      label = "Dark";
    } else if (lux > 800) {
      status = "warning";
      label = "Bright";
    } else {
      status = "normal";
      label = "Normal";
    }

    return {
      label: "Light",
      unit: "lx",
      displayValue: lux.toFixed(0),
      icon: <Lightbulb size={20} className="text-orange-500" />,
      statusLabel: label,
      statusLevel: status,
    };
  }

  // Humidity
  let status: StatusLevel = "normal";
  let label = "Comfort";

  if (value < 30) {
    status = "warning";
    label = "Too dry";
  } else if (value > 80) {
    status = "critical";
    label = "Critical";
  } else if (value > 70) {
    status = "warning";
    label = "Humid";
  }

  return {
    label: "Humidity",
    unit: "%",
    displayValue: value.toFixed(1),
    icon: <Droplets size={20} className="text-orange-500" />,
    statusLabel: label,
    statusLevel: status,
  };
}

/* ---------------------------------------------------
   STATUS COLOR
--------------------------------------------------- */
function getStatusColor(level: StatusLevel) {
  switch (level) {
    case "normal":
      return "bg-emerald-100 text-emerald-700";
    case "warning":
      return "bg-amber-100 text-amber-700";
    case "critical":
      return "bg-red-100 text-red-700";
    default:
      return "bg-neutral-100 text-neutral-500";
  }
}
