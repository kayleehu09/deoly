import { jsonError, jsonOk } from "@/lib/api";
import { addComment } from "@/lib/db";
import { requireSessionUser } from "@/lib/session-user";
import { assertCommentBody } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    return jsonOk({
      post: addComment({
        postId: id,
        userId: user.id,
        body: assertCommentBody(body.body)
      })
    });
  } catch (error) {
    return jsonError(error);
  }
}
