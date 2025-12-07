import {
  Thermometer,
  Lightbulb,
  Droplets,
  DoorOpen,
  DoorClosed,
  Lock,
  Unlock,
} from "lucide-react";

type SensorType =
  | "temperature"
  | "humidity"
  | "light"
  | "doorStatus"
  | "controlDoor";

type SensorCardProps = {
  sensor: SensorType;
  value: number | boolean | null;
  onToggle?: () => void;
};

type StatusLevel = "normal" | "warning" | "critical";

export default function SensorCard({
  sensor,
  value,
  onToggle,
}: SensorCardProps) {
  const config = getSensorConfig(sensor, value);
  const isLocked = sensor === "controlDoor" ? Boolean(value) : false;

  return (
    <div className="relative w-full flex bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Left color bar */}
      <div
        className={`w-2 rounded-l-2xl ${getStatusColor(config.statusLevel)}`}
      />

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-3 pb-10">
        {/* top row */}
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

        {/* value */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold">{config.displayValue}</span>

          {config.unit && (
            <span className="text-sm text-neutral-400">{config.unit}</span>
          )}
        </div>
      </div>

      {/* Toggle bottom-right (does NOT expand card height) */}
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
  rawValue: number | boolean | null
) {
  if (sensor === "doorStatus") {
    const isOpen = Boolean(rawValue);
    return {
      label: "Door Status",
      unit: "",
      displayValue: isOpen ? "Open" : "Closed",
      icon: isOpen ? (
        <DoorOpen size={20} className="text-orange-500" />
      ) : (
        <DoorClosed size={20} className="text-orange-500" />
      ),
      statusLabel: "",
      statusLevel: isOpen
        ? ("warning" as StatusLevel)
        : ("normal" as StatusLevel),
    };
  }

  if (sensor === "controlDoor") {
    const isLocked = Boolean(rawValue);
    return {
      label: "Door Lock Control",
      unit: "",
      displayValue: isLocked ? "Locked" : "Unlocked",
      icon: isLocked ? (
        <Lock size={20} className="text-orange-500" />
      ) : (
        <Unlock size={20} className="text-orange-500" />
      ),
      // status label might be optional
      statusLabel: isLocked ? "Secure" : "Not Locked",
      statusLevel: isLocked
        ? ("normal" as StatusLevel)
        : ("warning" as StatusLevel),
    };
  }

  const value = typeof rawValue === "number" ? rawValue : 0;

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

  if (sensor === "light") {
    let status: StatusLevel = "normal";
    let label = "Normal";

    if (value < 200) {
      status = "warning";
      label = "Too dark";
    } else if (value > 800) {
      status = "warning";
      label = "Too bright";
    }

    return {
      label: "Light",
      unit: "lx",
      displayValue: value.toFixed(0),
      icon: <Lightbulb size={20} className="text-orange-500" />,
      statusLabel: label,
      statusLevel: status,
    };
  }

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
