import { getCurrentUser } from "@/lib/auth";
import { ApiError } from "@/lib/validation";

export async function requireSessionUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError(401, "Please log in to continue.");
  }
  return user;
}
