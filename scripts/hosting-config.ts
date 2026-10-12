// Pure preflight: no network, database writes, secret values or environment loading.
export function hostingErrors(env: Record<string, string | undefined>): string[] {
  const errors: string[] = [];
  const app = env.NEXT_PUBLIC_APP_URL ?? "";
  try {
    const url = new URL(app);
    if (
      url.protocol !== "https:" ||
      url.origin !== app ||
      !url.hostname.includes(".") ||
      /(^|\.)(localhost|local|invalid|example|test)$/.test(url.hostname) ||
      /^[\d.]+$/.test(url.hostname)
    )
      throw new Error();
  } catch {
    errors.push(
      "NEXT_PUBLIC_APP_URL must be a public HTTPS origin without a path or trailing slash.",
    );
  }
  try {
    const url = new URL(env.DATABASE_URL ?? "");
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.username ||
      !url.password ||
      url.pathname.length < 2 ||
      !url.hostname.endsWith(".neon.tech") ||
      !url.hostname.includes("-pooler.") ||
      !["require", "verify-full"].includes(
        url.searchParams.get("sslmode") ?? "",
      )
    )
      throw new Error();
  } catch {
    errors.push(
      "DATABASE_URL must be a pooled Neon PostgreSQL URL with credentials, database and sslmode=require (or verify-full).",
    );
  }
  for (const name of ["TELEGRAM_CLIENT_ID", "TELEGRAM_CLIENT_SECRET"]) {
    if (!env[name]?.trim()) errors.push(`${name} is required.`);
  }
  if (env.DEV_AUTH !== "false")
    errors.push("DEV_AUTH must be false for hosting.");
  if (env.TUTOR_PROVIDER !== "disabled")
    errors.push("TUTOR_PROVIDER must be disabled for this pilot.");
  if (
    Object.keys(env).some(
      (name) =>
        name.startsWith("NEXT_PUBLIC_") &&
        /SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY|DATABASE|CLIENT_ID|FOLDER_ID/.test(
          name,
        ),
    )
  ) {
    errors.push(
      "Remove credential-like NEXT_PUBLIC_* variables; credentials must stay server-side.",
    );
  }
  return errors;
}
