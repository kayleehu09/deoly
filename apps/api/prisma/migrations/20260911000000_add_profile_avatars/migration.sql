ALTER TABLE "User" ADD COLUMN "avatarObjectKey" TEXT;
CREATE TABLE "AvatarUpload" (
  "objectKey" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'PENDING',
  "deleteAfter" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AvatarUpload_state_deleteAfter_idx" ON "AvatarUpload"("state", "deleteAfter");
CREATE INDEX "AvatarUpload_userId_idx" ON "AvatarUpload"("userId");
