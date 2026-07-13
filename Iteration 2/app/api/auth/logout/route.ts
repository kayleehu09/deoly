import { clearAuthSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST() {
  try {
    await clearAuthSession();
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
