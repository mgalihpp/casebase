import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { anonymous } from "better-auth/plugins";
import { profile } from "@/features/profile/schema";
import { sendEmail } from "@/lib/email";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Reset links are sent through Resend. The link is only sent to the
    // address that owns the account; Better Auth does not reveal whether it exists.
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Atur ulang kata sandi SQL Quest",
        html: `<p>Halo ${user.name},</p><p>Klik tautan ini untuk membuat kata sandi baru. Tautan berlaku sebentar.</p><p><a href="${url}">Atur ulang kata sandi</a></p><p>Kalau kamu tidak meminta ini, abaikan email ini.</p>`,
        text: `Halo ${user.name}, buka tautan ini untuk membuat kata sandi baru: ${url}. Kalau kamu tidak meminta ini, abaikan email ini.`,
      });
    },
  },
  // Google sign-in is enabled only when both keys are set, so the app still
  // runs (email/password only) without them.
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {},
  databaseHooks: {
    user: {
      create: {
        // Every new account gets a profile row right away. The sign-up screen
        // shows the privacy notice, so the consent time is recorded here.
        after: async (user) => {
          await db
            .insert(profile)
            .values({ userId: user.id })
            .onConflictDoNothing();
        },
      },
    },
  },
  plugins: [anonymous(), nextCookies()],
});
