import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/auth-screen";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/feed");
  }

  return <AuthScreen />;
}
