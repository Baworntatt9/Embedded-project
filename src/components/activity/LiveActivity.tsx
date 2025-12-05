"use client";

const STREAM_URL = "http://192.168.182.59:5000"; // เอา IP จริงของนายมาใส่

export default function LiveActivity() {
  return (
    <div className="mt-4 w-full rounded-md bg-black aspect-video overflow-hidden">
      <img
        src={STREAM_URL}
        alt="Live Camera"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
