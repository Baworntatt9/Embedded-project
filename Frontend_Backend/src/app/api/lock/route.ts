import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// GET /api/lock
// → ให้ ESP32 ใช้เรียกดูว่า controlLockDoor เป็น true/false/null
export async function GET() {
  try {
    const docRef = adminDb.collection("controlDoor").doc("current");
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "No lock data found" },
        { status: 404 }
      );
    }

    const data = snapshot.data();

    const controlLockDoor =
      typeof data?.controlLockDoor === "boolean" ? data.controlLockDoor : null;

    // ตามที่ต้องการ: ส่งกลับไปเฉพาะ controlLockDoor
    return NextResponse.json({ controlLockDoor });
  } catch (err) {
    console.error("Error fetching lock data:", err);
    return NextResponse.json(
      { error: "Failed to fetch lock data" },
      { status: 500 }
    );
  }
}

// PUT /api/lock
// → ให้ ESP32 ใช้เรียกหลังจากหมุนมอเตอร์เสร็จ
//    ใช้ "อัปเดตเฉพาะ lockStatus" เท่านั้น
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { lockStatus } = body as { lockStatus?: string };

    if (typeof lockStatus !== "string") {
      return NextResponse.json(
        { error: "lockStatus (string) is required" },
        { status: 400 }
      );
    }

    // จะไม่ยุ่งกับ controlLockDoor เลย
    const docRef = adminDb.collection("controlDoor").doc("current");

    await docRef.set(
      {
        lockStatus, // เก็บตามที่ส่งมาเลย เช่น "Locked" / "Unlocked"
        lockUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      message: "lockStatus updated successfully",
      lockStatus,
    });
  } catch (err) {
    console.error("Error updating lockStatus:", err);
    return NextResponse.json(
      { error: "Failed to update lockStatus" },
      { status: 500 }
    );
  }
}
