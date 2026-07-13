import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  appSessionTtlDays: Number(process.env.APP_SESSION_TTL_DAYS ?? 14),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    uploadUrlTtlSeconds: Number(process.env.R2_UPLOAD_URL_TTL_SECONDS ?? 300),
    readUrlTtlSeconds: Number(process.env.R2_READ_URL_TTL_SECONDS ?? 300)
  }
};
