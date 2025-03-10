// SCHEMA
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    authId: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.float64()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(
      v.union(v.literal("read"), v.literal("write"), v.literal("admin"))
    ),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("authId", ["authId"]),

  // Schema for Projects, Documents & Tasks
  projects: defineTable({
    type: v.string(), // 'project', 'document', or 'task'
    title: v.optional(v.string()),
    userId: v.id("users"),
    isArchived: v.boolean(),
    parentProject: v.union(v.null(), v.id("projects")),
    content: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    noteEmbeddings: v.optional(v.array(v.float64())),

    // Document-specific fields
    documentTitle: v.optional(v.string()),
    fileId: v.optional(v.string()),
    contentType: v.optional(v.string()),
    fileName: v.optional(v.string()),
    isProcessed: v.optional(v.boolean()),
    processedAt: v.optional(v.string()),
    isProcessing: v.optional(v.boolean()),
    progress: v.optional(v.number()),

    // Task-specific fields
    taskTitle: v.optional(v.string()),
    taskDescription: v.optional(v.string()),
    taskStatus: v.optional(
      v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"))
    ),
    taskPriority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    taskDueDate: v.optional(v.string()), // ISO date
    taskComments: v.optional(v.string()),
    taskEmbeddings: v.optional(v.array(v.float64())),

    // New Task Time, Recurrence, and Calendar Display Fields
    taskStartTime: v.optional(v.string()), // Format "HH:MM", e.g., "09:30"
    taskEndTime: v.optional(v.string()),   // Format "HH:MM", e.g., "10:30"
    taskAllDay: v.optional(v.boolean()),     // Flag to indicate an all-day task
    taskRecurring: v.optional(v.boolean()),    // Flag to indicate recurring task
    taskRecurrencePattern: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("yearly")
      )
    ),
    taskRecurrenceEnd: v.optional(v.string()), // Date format "YYYY-MM-DD"
    taskColor: v.optional(v.string()),         // Custom color code for calendar view
    taskReminder: v.optional(v.number()),        // Minutes before task to trigger reminder
  })
    .index("by_user", ["userId"])
    .index("by_user_parent", ["userId", "parentProject"])
    .index("by_user_taskStatus", ["userId", "taskStatus"])
    .index("by_user_due_date", ["userId", "taskDueDate"])
    .searchIndex("search_taskTitle", {
      searchField: "taskTitle",
      filterFields: ["userId", "taskStatus", "parentProject"],
    })
    .vectorIndex("byTaskEmbedding", {
      vectorField: "taskEmbeddings",
      dimensions: 1536,
      filterFields: ["userId", "taskStatus"],
    }),

  // Schema for Chunks
  chunks: defineTable({
    projectId: v.id("projects"),
    pageContent: v.string(),
    metadata: v.optional(
      v.object({
        docAuthor: v.optional(v.string()),
        docTitle: v.optional(v.string()),
        headings: v.optional(v.array(v.string())),
        isHeading: v.optional(v.boolean()),
        pageNumber: v.optional(v.number()),
        numTokens: v.optional(v.number()),
        snippet: v.optional(v.string()),
        module: v.optional(v.string()),
        keywords: v.optional(v.array(v.string())),
        entities: v.optional(v.array(v.string())),
        topics: v.optional(v.array(v.string())),
      })
    ),
    embedding: v.optional(v.array(v.float64())),
    chunkNumber: v.optional(v.number()),
    uniqueChunkId: v.string(),
  })
    .index("by_project", ["projectId"])
    .index("by_uniqueChunkId", ["uniqueChunkId"])
    .vectorIndex("byEmbedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["projectId"],
    })
    .searchIndex("search_pageContent", {
      searchField: "pageContent",
      filterFields: ["projectId"],
    }),

  // Schema for Chat
  chat: defineTable({
    input: v.string(),
    response: v.string(),
    projectId: v.optional(v.id("projects")),
    isGraphChat: v.optional(v.boolean()),
  })
    .index("by_project", ["projectId"]),

  // Schema for Graph Elements (Nodes and Links)
  graph: defineTable({
    // Discriminator: "node" or "link"
    elementType: v.string(),
    // Fields for nodes:
    documentChunkId: v.optional(v.string()),
    label: v.optional(v.string()),
    group: v.optional(v.string()),
    significance: v.optional(v.number()),
    // Fields for links:
    source: v.optional(v.string()),
    target: v.optional(v.string()),
    similarity: v.optional(v.number()),
    relationship: v.optional(v.string()),
  })
    .searchIndex("search_label", { searchField: "label" })
    .searchIndex("search_group", { searchField: "group" }),
});

export default schema;