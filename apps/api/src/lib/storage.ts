import { PutObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { config } from "../config.js";
import { ApiError } from "./errors.js";

export const ALLOWED_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

type AllowedImageContentType = (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

const IMAGE_EXTENSIONS: Record<AllowedImageContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

let s3Client: S3Client | null = null;

function requireR2Config() {
  const { accountId, accessKeyId, secretAccessKey, bucketName } = config.r2;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new ApiError(503, "PHOTO_STORAGE_NOT_CONFIGURED", "Photo storage is not configured yet.");
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName
  };
}

function getS3Client() {
  const r2Config = requireR2Config();

  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey
      }
    });
  }

  return {
    client: s3Client,
    bucketName: r2Config.bucketName
  };
}

export function isAllowedImageContentType(contentType: string): contentType is AllowedImageContentType {
  return ALLOWED_IMAGE_CONTENT_TYPES.includes(contentType as AllowedImageContentType);
}

export function createPostImageObjectKey(userId: string, contentType: AllowedImageContentType) {
  return `users/${userId}/posts/${nanoid(24)}.${IMAGE_EXTENSIONS[contentType]}`;
}

export function isPostImageObjectKeyForUser(objectKey: string, userId: string) {
  return objectKey.startsWith(`users/${userId}/posts/`);
}

export async function createPostImageUpload(input: {
  userId: string;
  contentType: AllowedImageContentType;
}) {
  const { client, bucketName } = getS3Client();
  const objectKey = createPostImageObjectKey(input.userId, input.contentType);
  const expiresIn = config.r2.uploadUrlTtlSeconds;
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: input.contentType
    }),
    { expiresIn }
  );

  return {
    objectKey,
    uploadUrl,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    headers: {
      "content-type": input.contentType
    }
  };
}

export async function createPostImageReadUrl(objectKey: string) {
  const { client, bucketName } = getS3Client();

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey
    }),
    { expiresIn: config.r2.readUrlTtlSeconds }
  );
}
