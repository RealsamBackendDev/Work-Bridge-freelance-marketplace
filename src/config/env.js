import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT secrets must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

const { value: env, error } = envSchema.safeParse(process.env);

if (error) {
  console.error("❌ Invalid environment variables:", error.flatten().fieldErrors);
  process.exit(1);
}

export default env;