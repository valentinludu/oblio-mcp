import { OblioApiException } from "@obliosoftware/oblioapi";

/** Format a thrown value into a human-readable message for MCP error responses. */
export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error instanceof OblioApiException) {
    return error.code !== 0
      ? `${error.message} (code ${error.code})`
      : error.message;
  }

  if (typeof error === "object" && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      // fall through
    }
  }

  return String(error);
};
