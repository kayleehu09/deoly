import { jsonError, jsonOk } from "@/lib/api";
import { getPostForUser } from "@/lib/db";
import { requireSessionUser } from "@/lib/session-user";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    return jsonOk({ post: getPostForUser(id, user.id) });
  } catch (error) {
    return jsonError(error);
  }
}
