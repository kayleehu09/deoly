import { authenticateUser } from "@/lib/db";
import { createAuthSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { assertEmail, assertPassword } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const user = authenticateUser(assertEmail(body.email), assertPassword(body.password));
    await createAuthSession(user.id);
    return jsonOk({ user });
  } catch (error) {
    return jsonError(error);
  }
}
