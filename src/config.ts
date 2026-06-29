import { z } from "zod";

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  CLIENT_ID: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  GUILD_ID: z.string().optional(),
  MOD_LOG_CHANNEL_ID: z.string().optional(),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}
