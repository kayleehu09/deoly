import { jsonError, jsonOk } from "@/lib/api";
import { searchUsers } from "@/lib/db";
import { requireSessionUser } from "@/lib/session-user";

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    return jsonOk({ users: query ? searchUsers(query, user.id) : [] });
  } catch (error) {
    return jsonError(error);
  }
}
