import { Suspense } from "react";
import { SearchScreen } from "@/components/search-screen";

export const metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading search…</p>}>
      <SearchScreen />
    </Suspense>
  );
}
