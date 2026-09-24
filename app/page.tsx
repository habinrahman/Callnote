import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading meetings…</p>}>
      <Dashboard />
    </Suspense>
  );
}
