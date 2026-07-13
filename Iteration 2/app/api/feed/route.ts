import { jsonError, jsonOk } from "@/lib/api";
import { getFeedForUser } from "@/lib/db";
import { requireSessionUser } from "@/lib/session-user";

export async function GET() {
  try {
    const user = await requireSessionUser();
    return jsonOk(getFeedForUser(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
