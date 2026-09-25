import { getStoredMeeting } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const meeting = await getStoredMeeting(id);
  if (!meeting) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(meeting);
}
