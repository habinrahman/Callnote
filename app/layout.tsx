import type { Metadata } from "next";
import { Suspense } from "react";
import { Shell } from "@/components/shell";
import { listMeetings } from "@/lib/domain/queries";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fathom",
  description: "Meeting notes, transcripts, and follow-ups.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <Shell meetings={listMeetings().map((meeting) => ({ id: meeting.id, title: meeting.title }))}>
            {children}
          </Shell>
        </Suspense>
      </body>
    </html>
  );
}
