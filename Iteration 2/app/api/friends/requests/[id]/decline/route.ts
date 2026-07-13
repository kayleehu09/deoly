import { jsonError, jsonOk } from "@/lib/api";
import { declineFriendRequest } from "@/lib/db";
import { requireSessionUser } from "@/lib/session-user";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    return jsonOk({ friendships: declineFriendRequest(id, user.id) });
  } catch (error) {
    return jsonError(error);
  }
}
