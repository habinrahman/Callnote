import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-md border border-line bg-card px-5 py-10 shadow-[var(--shadow-rest)]">
      <h1 className="font-serif text-2xl tracking-tight">That page is not in this workspace</h1>
      <p className="mt-2 text-sm text-muted">The meeting or clip may have been removed.</p>
      <Link href="/" className="mt-4 inline-block text-sm text-pine hover:underline">
        Back to meetings
      </Link>
    </div>
  );
}
