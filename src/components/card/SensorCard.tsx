import {
  Thermometer,
  Lightbulb,
  Droplets,
  DoorOpen,
  DoorClosed,
} from "lucide-react";

type SensorType = "temperature" | "humidity" | "light" | "doorStatus";

type SensorCardProps = {
  sensor: SensorType;
  value: number | boolean | null; // boolean for doorStatus
};

type StatusLevel = "normal" | "warning" | "critical";

export default function SensorCard({ sensor, value }: SensorCardProps) {
  const config = getSensorConfig(sensor, value);

  return (
    <div className="w-full flex bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Left color bar */}
      <div
        className={`w-2 rounded-l-2xl ${getStatusColor(config.statusLevel)}`}
      />

      {/* Card content */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        {/* top row: icon + badge */}
        <div className="flex items-start justify-between">
          {/* icon bubble */}
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
    </div>
  );
}

/**
 * เลือก icon, label, unit, status ตาม sensor + value
 */
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
      statusLabel: "", // ไม่ต้องมี badge
      statusLevel: isOpen
        ? ("normal" as StatusLevel)
        : ("critical" as StatusLevel),
    };
  }

  const value = typeof rawValue === "number" ? rawValue : 0;

  if (sensor === "temperature") {
    // logic อุณหภูมิ (°C)
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
      displayValue: value.toFixed(0),
      icon: <Thermometer size={20} className="text-orange-500" />,
      statusLabel: label,
      statusLevel: status,
    };
  }

  if (sensor === "light") {
    {
      // สมมติค่า ADC/ระดับแสง 0–1000
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
  }

  // sensor === "humidity"
  {
    // logic ความชื้น (%)
    let status: StatusLevel = "normal";
    let label = "Comfort";

    if (value < 30) {
      status = "warning";
      label = "Too dry";
    } else if (value > 70) {
      status = "warning";
      label = "Humid";
    } else if (value > 80) {
      status = "critical";
      label = "Critical";
    }

    return {
      label: "Humidity",
      unit: "%",
      displayValue: value.toFixed(0),
      icon: <Droplets size={20} className="text-orange-500" />,
      statusLabel: label,
      statusLevel: status,
    };
  }
}

/**
 * สีของ badge ตามระดับ status
 */
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
