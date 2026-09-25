import { searchMeetings } from "@/lib/domain/queries";
import { listStoredMeetings } from "@/lib/db";

export const runtime = "nodejs";

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json(searchMeetings(query, listStoredMeetings()));
}
