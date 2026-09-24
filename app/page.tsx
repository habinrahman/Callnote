import { Dashboard } from "@/components/dashboard";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <Dashboard query={q ?? ""} />;
}
