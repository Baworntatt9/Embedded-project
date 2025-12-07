type EventCardProps = {
  title: string;
  time: string;
  thumbnail?: string;
  onClick?: () => void;
};

export default function EventCard({
  title,
  time,
  thumbnail,
  onClick,
}: EventCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Left side */}
      <div className="flex flex-col text-left">
        <span className="text-sm font-medium text-neutral-800">{title}</span>
        <span className="text-xs text-neutral-500 mt-1">{time}</span>
      </div>

      {/* Right thumbnail */}
      {thumbnail ? (
        <img
          src={thumbnail}
          alt="thumbnail"
          className="w-20 h-12 rounded-lg object-cover bg-neutral-200"
        />
      ) : (
        <div className="w-20 h-12 rounded-lg bg-neutral-200" />
      )}
    </button>
  );
}
