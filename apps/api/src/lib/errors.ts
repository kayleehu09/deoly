import type { NextFunction, Request, Response } from "express";
import type { ApiErrorShape } from "@deoly/shared";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
  }
}

export function errorHandler(error: unknown, _req: Request, res: Response<ApiErrorShape>, _next: NextFunction) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({
      error: {
        message: error.message,
        code: error.code,
        details: error.details
      }
    });
  }

  if (error instanceof ZodError) {
    const details = Object.fromEntries(
      Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Array.isArray(entry[1]))
    );

    return res.status(400).json({
      error: {
        message: "Validation failed.",
        code: "VALIDATION_ERROR",
        details
      }
    });
  }

  console.error(error);

  return res.status(500).json({
    error: {
      message: "Something went wrong.",
      code: "INTERNAL_SERVER_ERROR"
    }
  });
}
