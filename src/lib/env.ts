import "server-only";
import { z } from "zod";

const envSchema = z.object({
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z
    .string()
    .min(1, "GOOGLE_SERVICE_ACCOUNT_EMAIL is required"),
  GOOGLE_PRIVATE_KEY: z.string().min(1, "GOOGLE_PRIVATE_KEY is required"),
  GOOGLE_SHEET_ID: z.string().min(1, "GOOGLE_SHEET_ID is required"),
});

type Env = z.infer<typeof envSchema>;

// Lazy: validation runs on first property access (request time), not at module
// load time — this prevents Vercel build failures when env vars are not set
// during the build step.
function getEnv(): Env {
  const result = envSchema.safeParse({
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
  });

  if (!result.success) {
    const missing = result.error.issues.map((i) => i.message).join(", ");
    throw new Error(
      `Missing environment variables: ${missing}. ` +
        `Copy .env.example to .env.local and fill in the values.`
    );
  }

  return {
    ...result.data,
    GOOGLE_PRIVATE_KEY: result.data.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
}

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string | symbol) {
    if (typeof prop !== "string") return undefined;
    return getEnv()[prop as keyof Env];
  },
});
