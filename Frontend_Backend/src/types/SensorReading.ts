export type SensorReading = {
  temperature: number | null;
  humidity: number | null;
  light: number | null;
  doorStatus: boolean | null;
};

export type controlDoorType = {
  controlLockDoor: boolean | null;
  lockStatus: "locked" | "unlocked" | null;
};
