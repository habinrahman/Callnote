export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-[28px] font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted">Workspace identity shown in Callnote. This demo does not save account settings.</p>
      <div className="mt-8 flex items-center gap-3 border-y border-line py-4">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-pine text-sm font-medium text-white">JE</span>
        <div>
          <p className="font-medium">Jonah Ellis</p>
          <p className="text-sm text-muted">Northstar Labs</p>
        </div>
      </div>
    </div>
  );
}
