import { beforeEach, describe, expect, it, vi } from "vitest";
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { copyVerifiedAvatar, deleteAvatarObject } from "../lib/storage.js";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@aws-sdk/client-s3", async (importOriginal) => ({
  ...await importOriginal<typeof import("@aws-sdk/client-s3")>(),
  S3Client: class { send = send; }
}));
vi.mock("../config.js", () => ({ config: { r2: {
  accountId: "test", accessKeyId: "test", secretAccessKey: "test", bucketName: "private-test",
  uploadUrlTtlSeconds: 300, readUrlTtlSeconds: 300
} } }));

beforeEach(() => send.mockReset());
const body = (bytes: number[]) => ({ Body: { transformToByteArray: async () => new Uint8Array(bytes) } });

describe("Private avatar storage validation", () => {
  it.each([
    { ContentLength: 8388609, ContentType: "image/jpeg" },
    { ContentLength: 0, ContentType: "image/jpeg" },
    { ContentLength: 30, ContentType: "text/html" }
  ])("rejects invalid stored object metadata: %j", async (metadata) => {
    send.mockResolvedValueOnce(metadata);
    await expect(copyVerifiedAvatar("upload", "saved")).rejects.toMatchObject({ code: "INVALID_AVATAR" });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("checks bytes rather than trusting the supplied MIME type", async () => {
    send.mockResolvedValueOnce({ ContentLength: 30, ContentType: "image/jpeg", ETag: '"version"' });
    send.mockResolvedValueOnce(body([60, 104, 116, 109, 108, 62]));
    await expect(copyVerifiedAvatar("upload", "saved")).rejects.toMatchObject({ code: "INVALID_AVATAR" });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["image/jpeg", [255, 216, 255, 224]],
    ["image/png", [137, 80, 78, 71, 13, 10, 26, 10]],
    ["image/webp", [...Buffer.from("RIFF0000WEBP")]]
  ])("copies verified %s images only when the inspected version still matches", async (contentType, bytes) => {
    send.mockResolvedValueOnce({ ContentLength: 30, ContentType: contentType, ETag: '"version"' });
    send.mockResolvedValueOnce(body(bytes as number[]));
    send.mockResolvedValueOnce({});
    await copyVerifiedAvatar("users/me/avatars/uploads/photo", "users/me/avatars/saved/photo");
    expect(send.mock.calls[1][0].input.IfMatch).toBe('"version"');
    expect(send.mock.calls[2][0]).toBeInstanceOf(CopyObjectCommand);
    expect(send.mock.calls[2][0].input).toMatchObject({ Bucket: "private-test", CopySourceIfMatch: '"version"', Key: "users/me/avatars/saved/photo" });
  });

  it.each([404, 412])("handles missing or concurrently changed uploads (%s)", async (httpStatusCode) => {
    send.mockRejectedValueOnce({ $metadata: { httpStatusCode } });
    await expect(copyVerifiedAvatar("upload", "saved")).rejects.toMatchObject({ code: "AVATAR_UPLOAD_INCOMPLETE" });
  });

  it("deletes only the specified object in the private bucket", async () => {
    send.mockResolvedValueOnce({});
    await deleteAvatarObject("users/me/avatars/saved/retired");
    expect(send.mock.calls[0][0]).toBeInstanceOf(DeleteObjectCommand);
    expect(send.mock.calls[0][0].input).toEqual({ Bucket: "private-test", Key: "users/me/avatars/saved/retired" });
  });
});
