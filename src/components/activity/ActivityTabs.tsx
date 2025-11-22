type Tab = "live" | "record";

type ActivityTabsProps = {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
};

export default function ActivityTabs({
  activeTab,
  onChange,
}: ActivityTabsProps) {
  return (
    <div className="w-full bg-white rounded-full shadow-sm p-1 flex">
      <button
        type="button"
        onClick={() => onChange("live")}
        className={`flex-1 text-sm py-2 rounded-full transition text-center
          ${
            activeTab === "live"
              ? "bg-[#bcded7] text-black"
              : "bg-transparent text-gray-600"
          }`}
      >
        Live
      </button>
      <button
        type="button"
        onClick={() => onChange("record")}
        className={`flex-1 text-sm py-2 rounded-full transition text-center
          ${
            activeTab === "record"
              ? "bg-[#bcded7] text-black"
              : "bg-transparent text-gray-600"
          }`}
      >
        Record
      </button>
    </div>
  );
}
