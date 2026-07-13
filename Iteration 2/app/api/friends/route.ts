import { jsonError, jsonOk } from "@/lib/api";
import { getFriendsState } from "@/lib/db";
import { requireSessionUser } from "@/lib/session-user";

export async function GET() {
  try {
    const user = await requireSessionUser();
    return jsonOk(getFriendsState(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
