"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CapturedMeetingView } from "@/components/captured-meeting";

function CapturedPage() {
  const id = useSearchParams().get("id") ?? "";
  if (!id) return <p className="text-sm text-muted">Missing recording.</p>;
  return <CapturedMeetingView id={id} />;
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading recording…</p>}>
      <CapturedPage />
    </Suspense>
  );
}
