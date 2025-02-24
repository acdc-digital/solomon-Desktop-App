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
    console.log("--- upsertUser MUTATION EXECUTING ---");
    console.log("Arguments received:", { authId, name, email, image });

    let existingUser: Doc<"users"> | null = null;

    if (email) {
      existingUser = await db.query("users").withIndex("email", (q) => q.eq("email", email)).first();
    }

    if (existingUser) {
      console.log("User found by email, patching:", existingUser._id);
      // Patch existing user, explicitly setting authId and other fields
      const patchPayload: Partial<Doc<"users">> = { authId }; // Explicitly create patch payload
      if (name !== undefined) patchPayload.name = name;
      if (email !== undefined) patchPayload.email = email;
      if (image !== undefined) patchPayload.image = image;

      console.log("Patching user with payload:", patchPayload); // Log patch payload

      await db.patch(existingUser._id, patchPayload); // Patch with explicit payload

      // Add a small delay after patching (for potential indexing lag - try 500ms)
      await new Promise(resolve => setTimeout(resolve, 500)); // Add 500ms delay

      const updatedUser = await db.get(existingUser._id); // Re-fetch user after patch and delay
      console.log("Updated user after patch and delay:", updatedUser); // Log re-fetched user
      return updatedUser;

    } else {
      console.log("No existing user found by email, creating new user with authId:", authId);
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

      console.log("Inserting new user:", newUser); // Log new user payload before insert

      const newUserId: Id<"users"> = await db.insert("users", newUser);

      // Add a small delay after inserting (for potential indexing lag - try 500ms)
      await new Promise(resolve => setTimeout(resolve, 500)); // Add 500ms delay

      const insertedUser = await db.get(newUserId); // Re-fetch user after insert and delay
      console.log("Inserted user after insert and delay:", insertedUser); // Log re-fetched user
      return insertedUser;
    }
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