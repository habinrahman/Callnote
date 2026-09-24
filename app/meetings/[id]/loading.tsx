export default function MeetingLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-4 w-24 rounded bg-sand" />
      <div className="h-8 w-2/3 rounded bg-sand" />
      <div className="h-40 rounded-lg bg-sand" />
      <div className="h-64 rounded-lg bg-sand" />
    </div>
  );
}
