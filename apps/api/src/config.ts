import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  appSessionTtlDays: Number(process.env.APP_SESSION_TTL_DAYS ?? 14),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000"
};
