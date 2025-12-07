type EventVideoModalProps = {
  open: boolean;
  event: {
    title: string;
    date: string;
    time: string;
    videoUrl: string;
  } | null;
  onClose: () => void;
};

export default function EventVideoModal({
  open,
  event,
  onClose,
}: EventVideoModalProps) {
  if (!open || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl w-full max-w-md p-4 relative">
        {/* close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-3 text-neutral-400 hover:text-neutral-600 text-2xl leading-none cursor-pointer"
        >
          ×
        </button>

        <h2 className="text-base font-semibold text-neutral-900 pr-6 ml-1">
          {event.title}
        </h2>
        <p className="text-xs text-neutral-500 mt-1 ml-1">
          {event.date} • {event.time}
        </p>

        <div className="mt-4 rounded-xl overflow-hidden bg-black">
          <video src={event.videoUrl} controls className="w-full h-auto" />
        </div>
      </div>
    </div>
  );
}
