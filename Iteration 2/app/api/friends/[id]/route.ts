import { jsonError, jsonOk } from "@/lib/api";
import { removeFriend } from "@/lib/db";
import { requireSessionUser } from "@/lib/session-user";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    return jsonOk({ friendships: removeFriend(id, user.id) });
  } catch (error) {
    return jsonError(error);
  }
}
