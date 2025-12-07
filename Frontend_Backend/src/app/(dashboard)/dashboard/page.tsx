import SensorSection from "@/components/section/SensorSection";
import ActivitySection from "@/components/section/ActivitySection";

export default function mainPage() {
  return (
    <div className="p-4 space-y-6">
      <SensorSection />
      <ActivitySection />
    </div>
  );
}
