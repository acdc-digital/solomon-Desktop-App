// convex/auth.ts (Implement afterUserCreatedOrUpdated to patch users.authId)
import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  // afterUserCreatedOrUpdated callback to patch users.authId
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      console.log("--- afterUserCreatedOrUpdated CALLBACK EXECUTING ---");
      console.log("Callback Arguments:", args); // Log callback arguments
      const profile = args.profile;
      const userId = args.userId; // Get userId from args

      if (!profile) {
        console.warn("profile is not available in afterUserCreatedOrUpdated callback.");
        return;
      }

      try {
        let authId: string;
        if (profile.id) {
          authId = `github|${profile.id}`;
        } else if (profile.email) {
          authId = `github|${profile.email}`;
          console.warn("Warning: Using profile.email as fallback for authId. profile.id is undefined.");
        } else {
          authId = 'github|unknown';
          console.error("Error: Could not generate authId. profile.id and profile.email are undefined.");
        }
        console.log("Generated authId:", authId);

        // Patch users.authId in your custom users table
        console.log("Patching users table with authId:", authId, "for userId:", userId); // Log patch action
        await ctx.db.patch(userId, { authId: authId }); // <--- PATCH users.authId HERE!
        console.log("users table patched successfully with authId.");

      } catch (error: any) {
        console.error("Error in afterUserCreatedOrUpdated callback:", error);
        throw error;
      }
    },
  },
});

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