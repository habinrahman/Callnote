import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClip, listClipIds } from "@/lib/domain/queries";
import { ShareView } from "@/components/share-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clipId: string }>;
}): Promise<Metadata> {
  const { clipId } = await params;
  const view = getClip(clipId);
  return {
    title: view?.clip.title ?? "Clip",
    description: view?.clip.note,
    openGraph: view
      ? { title: `${view.clip.title} · Callnote`, description: view.clip.note, siteName: "Callnote" }
      : undefined,
  };
}

export function generateStaticParams() {
  return listClipIds().map((clipId) => ({ clipId }));
}

export const dynamicParams = false;

export default async function SharePage({ params }: { params: Promise<{ clipId: string }> }) {
  const { clipId } = await params;
  const view = getClip(clipId);
  if (!view) notFound();
  return <ShareView view={view} />;
}
