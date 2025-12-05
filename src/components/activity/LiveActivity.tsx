"use client";

import { useState } from "react";

const STREAM_URL = "http://192.168.182.59:5000/video_feed"; // use with Flask server

export default function LiveActivity() {
  const [error, setError] = useState(false);

  return (
    <div className="mt-4 w-full rounded-md bg-black aspect-video overflow-hidden relative">
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-red-300 text-sm">
          Cannot load stream
        </div>
      )}

      {/* Live stream image */}
      <img
        src={STREAM_URL}
        alt="Live Camera"
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}
