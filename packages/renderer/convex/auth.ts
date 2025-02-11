import GitHub from "@auth/core/providers/github";
// import Resend from "@auth/core/providers/resend";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { VALID_ROLES } from "./lib/permissions";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Configure authentication using Convex's auth system.
 * This setup enables:
 * - GitHub OAuth authentication
 * - Resend email authentication
 *
 * The exported functions (auth, signIn, signOut, store) can be used
 * in your frontend to manage authentication state.
 *
 * We supply a custom `createUser` callback to ensure that the new user
 * document includes an `authId` field. (We cast the config as `any` to allow this.)
 */
export const { auth, signIn, signOut, store } = convexAuth(
  ({
    providers: [
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID || "",
        clientSecret: process.env.AUTH_GITHUB_SECRET || "",
      }),
    ],
    // Custom createUser callback to ensure authId is set.
    createUser: async (ctx: any, providerUser: any) => {
      // For GitHub, we can derive an authId by prefixing the provider id.
      return {
        authId: `github|${providerUser.id}`,
        email: providerUser.email,
        emailVerificationTime: providerUser.emailVerificationTime,
        image: providerUser.image,
        name: providerUser.name,
      };
    },
    callbacks: {
      /**
       * This callback runs after a user signs in or updates their auth info.
       * Here we set the default role for new users.
       */
      async afterUserCreatedOrUpdated(ctx: any, args: any) {
        await ctx.db.patch(args.userId, {
          role: VALID_ROLES.READ,
        });
      },
    },
  } as any) // Cast to any to bypass type-checking on unsupported properties.
);

/**
 * Query to get the currently authenticated user's data.
 * Returns null if no user is signed in.
 */
export const getMe = query({
  args: {},
  handler: async (ctx: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

/**
 * Mutation to update the current user's role.
 * This should typically be restricted to admin users.
 *
 * @throws Error if user is not signed in.
 */
export const updateRole = mutation({
  args: {
    role: v.union(v.literal("read"), v.literal("write"), v.literal("admin")),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    await ctx.db.patch(userId, { role: args.role });
  },
});