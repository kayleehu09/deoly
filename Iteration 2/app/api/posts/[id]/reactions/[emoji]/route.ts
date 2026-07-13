import { jsonError, jsonOk } from "@/lib/api";
import { removeReaction } from "@/lib/db";
import { requireSessionUser } from "@/lib/session-user";
import { assertReactionEmoji } from "@/lib/validation";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; emoji: string }> }
) {
  try {
    const user = await requireSessionUser();
    const { id, emoji } = await context.params;
    return jsonOk({
      post: removeReaction({
        postId: id,
        userId: user.id,
        emoji: assertReactionEmoji(decodeURIComponent(emoji))
      })
    });
  } catch (error) {
    return jsonError(error);
  }
}
