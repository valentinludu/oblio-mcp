/**
 * Format any thrown value into a useful, human-readable message.
 *
 * Handles:
 *  - Standard `Error` instances (incl. AxiosError) → uses `.message`
 *  - `OblioApiException` thrown by `@obliosoftware/oblioapi` — this class does NOT
 *    extend `Error`, so `error instanceof Error` is `false` and a naive
 *    `String(error)` collapses to `"[object Object]"`. Reading `.message` and
 *    optionally `.code` recovers the actual API error.
 *  - Other plain objects with a `message` field
 *  - Primitives (string, number, etc.) → `String(value)`
 *
 * Always returns a string suitable for display in the MCP error response.
 */
export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const e = error as { message?: unknown; code?: unknown; statusMessage?: unknown };
    const message =
      typeof e.message === "string" && e.message.length > 0
        ? e.message
        : typeof e.statusMessage === "string" && e.statusMessage.length > 0
          ? e.statusMessage
          : null;

    if (message) {
      return typeof e.code === "number" && e.code !== 0
        ? `${message} (code ${e.code})`
        : message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      // fall through to String(error)
    }
  }

  return String(error);
};
