import type { Metadata } from "next";
import { Suspense } from "react";
import { Shell } from "@/components/shell";
import { listMeetings } from "@/lib/domain/queries";
import "./globals.css";

const description = "Meeting notes, transcripts, and follow-ups.";

export const metadata: Metadata = {
  applicationName: "Callnote",
  title: {
    default: "Callnote",
    template: "%s · Callnote",
  },
  description,
  openGraph: {
    title: "Callnote",
    description,
    siteName: "Callnote",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Callnote",
    description,
  },
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
