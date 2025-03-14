// /convex/labelCache.ts
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/convex/labelCache.ts

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Store generated labels in a cache table
export const storeLabel = mutation({
  args: {
    textHash: v.string(), // MD5 hash of the original text
    originalText: v.string(),
    label: v.string(),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, { textHash, originalText, label, createdAt }) => {
    return await ctx.db.insert("labelCache", {
      textHash,
      originalText,
      label,
      createdAt: createdAt || Date.now(),
    });
  },
});

// Retrieve a cached label
export const getLabel = query({
  args: {
    textHash: v.string(),
  },
  handler: async (ctx, { textHash }) => {
    const cached = await ctx.db
      .query("labelCache")
      .filter(q => q.eq(q.field("textHash"), textHash))
      .first();
    
    return cached?.label;
  },
});

// Update batch of nodes with AI-generated labels
export const updateNodesWithLabels = mutation({
  args: {
    nodeUpdates: v.array(
      v.object({
        id: v.id("graph"),
        label: v.string(),
      })
    ),
  },
  handler: async (ctx, { nodeUpdates }) => {
    const results = [];
    
    for (const update of nodeUpdates) {
      results.push(
        await ctx.db.patch(update.id, {
          label: update.label,
        })
      );
    }
    
    return results;
  },
});