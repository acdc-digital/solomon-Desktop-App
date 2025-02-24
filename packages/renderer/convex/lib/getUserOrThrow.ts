// convex/lib/getUserOrThrow.ts
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function getStableUserDoc(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("User not authenticated.");
  }
  // identity.subject might be "jx70...|jh7..."
  const stableUserIdStr = identity.subject.split("|")[0];
  const userDoc = await ctx.db.get(stableUserIdStr as Id<"users">);
  if (!userDoc) {
    throw new Error("No user doc found for this identity.");
  }
  return userDoc;
}