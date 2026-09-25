import Link from "next/link";

const topics = [
  { href: "/meetings/northwind-renewal/", title: "Working with transcripts" },
  { href: "/share/northwind-decision/", title: "Sharing meeting moments" },
  { href: "/meetings/reliability-review/", title: "Managing action items" },
  { href: "/search/", title: "Search and keyboard navigation" },
];

export const metadata = { title: "Help" };

export default function HelpPage() {
  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight">Help</h1>
      <p className="mt-1 text-sm text-muted">Answers and guidance for getting the most from Callnote.</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {topics.map((topic) => (
          <li key={topic.title}>
            <Link href={topic.href} className="flex items-center justify-between rounded-lg border border-line bg-white px-4 py-3 text-sm">
              <span className="flex items-center gap-2">
                <span className="text-pine" aria-hidden="true">◎</span>
                {topic.title}
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
