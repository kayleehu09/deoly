import { createAuthSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { createUser } from "@/lib/db";
import { assertEmail, assertPassword, assertString } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const user = createUser({
      displayName: assertString(body.displayName, "displayName"),
      username: assertString(body.username, "username"),
      email: assertEmail(body.email),
      password: assertPassword(body.password)
    });

    await createAuthSession(user!.id);
    return jsonOk({ user });
  } catch (error) {
    return jsonError(error);
  }
}
