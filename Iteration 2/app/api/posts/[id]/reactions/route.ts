import { jsonError, jsonOk } from "@/lib/api";
import { addReaction } from "@/lib/db";
import { requireSessionUser } from "@/lib/session-user";
import { assertReactionEmoji } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    return jsonOk({
      post: addReaction({
        postId: id,
        userId: user.id,
        emoji: assertReactionEmoji(body.emoji)
      })
    });
  } catch (error) {
    return jsonError(error);
  }
}
