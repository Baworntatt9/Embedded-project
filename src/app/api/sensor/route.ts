import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const docRef = adminDb.collection("sensorReadings").doc("current");
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "No sensor data found" },
        { status: 404 }
      );
    }

    return NextResponse.json(snapshot.data());
  } catch (err) {
    console.error("Error fetching sensor data:", err);
    return NextResponse.json(
      { error: "Failed to fetch sensor data" },
      { status: 500 }
    );
  }
}
