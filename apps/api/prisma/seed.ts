import bcrypt from "bcryptjs";
import { PrismaClient, FriendshipStatus, PostKind } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.reaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const [ava, noah, zoe] = await Promise.all([
    prisma.user.create({
      data: {
        email: "ava@example.com",
        username: "avafaith",
        displayName: "Ava Grace",
        passwordHash,
        bio: "Sharing what God is teaching me this week.",
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80"
      }
    }),
    prisma.user.create({
      data: {
        email: "noah@example.com",
        username: "noahlight",
        displayName: "Noah James",
        passwordHash,
        bio: "Prayer requests welcome anytime.",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
      }
    }),
    prisma.user.create({
      data: {
        email: "zoe@example.com",
        username: "zoefaith",
        displayName: "Zoe Marie",
        passwordHash,
        bio: "Daily devotionals and honest thoughts.",
        avatarUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80"
      }
    })
  ]);

  await prisma.friendship.createMany({
    data: [
      {
        requesterId: ava.id,
        addresseeId: noah.id,
        status: FriendshipStatus.ACCEPTED,
        acceptedAt: new Date()
      },
      {
        requesterId: zoe.id,
        addresseeId: ava.id,
        status: FriendshipStatus.PENDING
      }
    ]
  });

  const now = new Date();
  const hour = 60 * 60 * 1000;

  const avaActiveDeoly = await prisma.post.create({
    data: {
      authorId: ava.id,
      body: "A quiet morning reminder: start with gratitude before the day gets loud.",
      kind: PostKind.DEOLY,
      createdAt: new Date(now.getTime() - hour),
      expiresAt: new Date(now.getTime() + 23 * hour)
    }
  });

  await prisma.post.create({
    data: {
      authorId: ava.id,
      body: "Archived deoly: learning to notice answered prayers after the moment passes.",
      kind: PostKind.DEOLY,
      createdAt: new Date(now.getTime() - 3 * 24 * hour),
      expiresAt: new Date(now.getTime() - 2 * 24 * hour)
    }
  });

  const noahActiveDeoly = await prisma.post.create({
    data: {
      authorId: noah.id,
      body: "Today’s devotional reminder: peace is not the absence of noise, it’s staying close to God in the middle of it.",
      kind: PostKind.DEOLY,
      createdAt: new Date(now.getTime() - 2 * hour),
      expiresAt: new Date(now.getTime() + 22 * hour)
    }
  });

  await prisma.post.create({
    data: {
      authorId: noah.id,
      body: "Permanent note: keeping a record of the prayers that shaped this season.",
      kind: PostKind.PERMANENT,
      createdAt: new Date(now.getTime() - 3 * hour),
      expiresAt: null
    }
  });

  await prisma.post.create({
    data: {
      authorId: zoe.id,
      body: "Zoe's active deoly should stay out of Ava's feed until they are friends.",
      kind: PostKind.DEOLY,
      createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 23.5 * hour)
    }
  });

  await prisma.comment.create({
    data: {
      postId: noahActiveDeoly.id,
      authorId: ava.id,
      body: "Needed this today. Praying through it with you."
    }
  });

  await prisma.reaction.create({
    data: {
      postId: noahActiveDeoly.id,
      userId: ava.id,
      emoji: "🙏"
    }
  });

  await prisma.reaction.create({
    data: {
      postId: avaActiveDeoly.id,
      userId: noah.id,
      emoji: "❤️"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
