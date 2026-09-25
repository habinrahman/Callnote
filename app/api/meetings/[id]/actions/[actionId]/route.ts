import { setActionDone } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string; actionId: string }> }) {
  const { id, actionId } = await context.params;
  const body = (await request.json()) as { done?: boolean };
  if (typeof body.done !== "boolean") return Response.json({ error: "done must be boolean" }, { status: 400 });
  const meeting = setActionDone(id, actionId, body.done);
  if (!meeting) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(meeting);
}
