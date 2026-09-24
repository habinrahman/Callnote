import { Suspense } from "react";
import { CalendarBoard } from "@/components/calendar-board";

export const metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading calendar…</p>}>
      <CalendarBoard />
    </Suspense>
  );
}
