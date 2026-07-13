import { jsonError, jsonOk } from "@/lib/api";
import { createPost } from "@/lib/db";
import { requireSessionUser } from "@/lib/session-user";
import { assertPostBody, assertVisibility } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as Record<string, unknown>;
    const post = createPost({
      authorId: user.id,
      body: assertPostBody(body.body),
      visibility: assertVisibility(body.visibility)
    });
    return jsonOk({ post }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
