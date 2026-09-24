import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-line bg-card px-5 py-10">
      <h1 className="text-xl font-semibold">That page is not in this workspace</h1>
      <p className="mt-2 text-sm text-muted">The meeting or clip may have been removed.</p>
      <Link href="/" className="mt-4 inline-block text-sm text-pine hover:underline">
        Back to meetings
      </Link>
    </div>
  );
}
