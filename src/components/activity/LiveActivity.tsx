"use client";

import { useState } from "react";

const STREAM_URL = "http://192.168.182.59:5000/video_feed";

export default function LiveActivity() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="mt-4 w-full rounded-md bg-black aspect-video overflow-hidden relative">
      {/* Loading state */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm">
          <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full mr-3" />
          Loading live stream...
        </div>
      )}

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
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}
