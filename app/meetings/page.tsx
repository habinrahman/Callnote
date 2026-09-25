import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard";

export const metadata = { title: "Meetings" };

export default function MeetingsIndexPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading meetings…</p>}>
      <Dashboard />
    </Suspense>
  );
}
