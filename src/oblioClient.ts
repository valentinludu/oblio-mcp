import OblioApi, {
  type AccessToken,
  type AccessTokenHandlerInterface,
} from "@obliosoftware/oblioapi";
import type { EnvConfig } from "./config.js";

const TOKEN_EXPIRY_MARGIN_SECONDS = 60;

/**
 * Keeps the Oblio access token in process memory.
 *
 * Without a handler, the SDK caches the token in `<cwd>/storage/.access_token`:
 * a file readable by other users and shared by every process started from the
 * same directory, regardless of which Oblio account the token belongs to.
 */
class MemoryAccessTokenHandler implements AccessTokenHandlerInterface {
  private token: AccessToken | null = null;

  get(): AccessToken {
    const token = this.token;
    const expiresAt = token
      ? Number(token.request_time) + Number(token.expires_in)
      : 0;
    const now = Math.floor(Date.now() / 1000);
    // The SDK requests a new token on null, even though its interface doesn't allow it.
    return (
      expiresAt - TOKEN_EXPIRY_MARGIN_SECONDS > now ? token : null
    ) as AccessToken;
  }

  set(accessToken: AccessToken): void {
    this.token = accessToken;
  }
}

export function createOblioClient(config: EnvConfig): OblioApi {
  const client = new OblioApi(
    config.OBLIO_API_EMAIL,
    config.OBLIO_API_SECRET,
    new MemoryAccessTokenHandler(),
  );

  if (config.CIF) {
    client.setCif(config.CIF);
  }

  return client;
}
