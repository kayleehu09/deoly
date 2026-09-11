import { PutObjectCommand, GetObjectCommand, HeadObjectCommand, CopyObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

export async function createAvatarImageUpload(userId: string, contentType: AllowedImageContentType) {
  const { client, bucketName } = getS3Client();
  const objectKey = `users/${userId}/avatars/uploads/${nanoid(24)}.${IMAGE_EXTENSIONS[contentType]}`;
  const expiresIn = config.r2.uploadUrlTtlSeconds;
  return {
    objectKey,
    uploadUrl: await getSignedUrl(client, new PutObjectCommand({
      Bucket: bucketName, Key: objectKey, ContentType: contentType
    }), { expiresIn }),
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    headers: { "content-type": contentType }
  };
}

// Copy to an immutable key: an unexpired upload URL cannot overwrite a saved avatar.
export async function copyVerifiedAvatar(sourceKey: string, destinationKey: string) {
  const { client, bucketName } = getS3Client();
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: sourceKey }));
    if (!head.ContentLength || head.ContentLength > MAX_IMAGE_UPLOAD_BYTES ||
        !head.ContentType || !isAllowedImageContentType(head.ContentType)) {
      throw new ApiError(400, "INVALID_AVATAR", "Choose a JPEG, PNG, or WebP image under 8 MB.");
    }
    const image = await client.send(new GetObjectCommand({
      Bucket: bucketName, Key: sourceKey, Range: "bytes=0-15", IfMatch: head.ETag
    }));
    const bytes = Buffer.from(await image.Body!.transformToByteArray());
    const valid = head.ContentType === "image/jpeg" ? bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
      : head.ContentType === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    if (!valid) throw new ApiError(400, "INVALID_AVATAR", "That file is not a supported image.");
    await client.send(new CopyObjectCommand({
      Bucket: bucketName, Key: destinationKey,
      CopySource: `${bucketName}/${sourceKey.split("/").map(encodeURIComponent).join("/")}`,
      CopySourceIfMatch: head.ETag
    }));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404 || status === 412) {
      throw new ApiError(400, "AVATAR_UPLOAD_INCOMPLETE", "The photo upload is incomplete. Please choose it again.");
    }
    throw error;
  }
}

export async function deleteAvatarObject(objectKey: string) {
  const { client, bucketName } = getS3Client();
  await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: objectKey }));
}
