import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const docRef = adminDb.collection("sensorReadings").doc("current");

    await docRef.set(
      {
        ...body,
      },
      { merge: true }
    );

    return NextResponse.json({ message: "Sensor data updated successfully" });
  } catch (err) {
    console.error("Error updating sensor data:", err);
    return NextResponse.json(
      { error: "Failed to update sensor data" },
      { status: 500 }
    );
  }
}
