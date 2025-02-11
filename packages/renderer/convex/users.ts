// convex/users.ts
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { DatabaseWriter } from "./_generated/server"; // Import DatabaseWriter

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return ctx.db.query("users").filter((q) => q.eq(q.field("authId"), userId)).first();
  },
});

export const getUser = query({
  args: { id: v.string() },
  handler: async ({ db }, { id }) => {
    if (!id) {
      return null;
    }
    return db.query("users").filter((q) => q.eq(q.field("authId"), id)).first();
  },
});

export const upsertUser = mutation({
  args: {
    authId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async ({ db }, { authId, name, email, image }) => {
    const existingUser = await db.query("users").filter((q) => q.eq(q.field("authId"), authId)).first();

    if (existingUser) {
      await db.patch(existingUser._id, {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(image !== undefined && { image }),
      });
      return db.get(existingUser._id) as Promise<Doc<"users">>;
    }

    // Build the new user object, omitting undefined fields
    const newUser: { authId: string; name?: string; email?: string; image?: string } = {
      authId,
    };
    if (name !== undefined) {
      newUser.name = name;
    }
    if (email !== undefined) {
      newUser.email = email;
    }
    if (image !== undefined) {
      newUser.image = image;
    }

    const newUserId: Id<"users"> = await db.insert("users", newUser);
    return db.get(newUserId) as Promise<Doc<"users">>;
  },
});

export const fixMissingAuthId = mutation({
  args: {},
  handler: async ({ db }: { db: DatabaseWriter }) => { // Explicitly type db
    const usersWithoutAuthId = await db.query("users")
      .filter((q) => q.eq(q.field("authId"), undefined))  // Find docs where authId is undefined or missing
      .collect();

    for (const user of usersWithoutAuthId) {
      const newAuthId = (db as any).generateId("users"); // Generate a new Convex ID, with type assertion

      await db.patch(user._id, { authId: newAuthId });
      console.log(`Updated user ${user._id} with authId: ${newAuthId}`);
    }
    if (usersWithoutAuthId.length === 0) {
      console.log("No users found missing authId.");
    }
  },
});