export function isAllowedRequestOrigin(
  origin: string | null,
  requestUrl: string,
  configuredUrl: string,
  development: boolean,
) {
  if (!origin) return false;
  try {
    if (origin === new URL(configuredUrl).origin) return true;
    const target = new URL(requestUrl);
    // A public Telegram callback URL must not disable local development.
    // Only the actual loopback request origin is accepted as an alternative.
    return (
      development &&
      ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) &&
      origin === target.origin
    );
  } catch {
    return false;
  }
}
