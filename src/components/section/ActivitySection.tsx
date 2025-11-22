"use client";

import { useState } from "react";
import ActivityTabs from "@/components/activity/ActivityTabs";
import LiveActivity from "@/components/activity/LiveActivity";
// import RecordActivity from "@/components/activity/RecordActivity";

type Tab = "live" | "record";

export default function ActivitySection() {
  const [tab, setTab] = useState<Tab>("live");

  return (
    <section className="space-y-4 pt-2">
      <h2 className="text-xl font-semibold tracking-tight">Activity</h2>

      <ActivityTabs activeTab={tab} onChange={setTab} />

      {tab === "live" ? (
        <LiveActivity />
      ) : (
        <div />
        // <RecordActivity />
      )}
    </section>
  );
}
