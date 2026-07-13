import { jsonError, jsonOk } from "@/lib/api";
import { sendFriendRequest } from "@/lib/db";
import { requireSessionUser } from "@/lib/session-user";
import { assertString } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as Record<string, unknown>;
    return jsonOk({
      friendships: sendFriendRequest(user.id, assertString(body.targetUserId, "targetUserId"))
    });
  } catch (error) {
    return jsonError(error);
  }
}
