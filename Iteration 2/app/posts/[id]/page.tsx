import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ThreadScreen } from "@/components/thread-screen";
import { requireUser } from "@/lib/auth";
import { getPostForUser } from "@/lib/db";
import { ApiError } from "@/lib/validation";

export default async function PostThreadPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();

  try {
    const { id } = await params;
    const post = getPostForUser(id, user.id);

    return (
      <AppShell
        viewer={user}
        title="Post thread"
        subtitle="Read the full thread, react, and leave a supportive reply."
        activePath="/feed"
      >
        <ThreadScreen post={post} />
      </AppShell>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
