// PROJECTS
// /Users/matthewsimon/Documents/GitHub/solomon-electron/solomon-electron/next/convex/projects.ts

import { v } from "convex/values";
import { getStableUserDoc } from "./lib/getUserOrThrow";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const getParentProjectId = query({
	args: {
	  documentId: v.id("projects"),
	},
	handler: async (ctx, { documentId }) => {
	  const doc = await ctx.db.get(documentId);
	  if (!doc) return null;
	  if (doc.type !== "document") return null;

	  // doc.parentProject is typed as `Id<"projects"> | null`
	  return doc.parentProject ?? null;
	},
  });

  export const createDocument = mutation({
    args: {
        documentTitle: v.string(),
        fileId: v.optional(v.string()),
		contentType: v.optional(v.string()), 
    	fileName: v.optional(v.string()),    
        documentContent: v.optional(v.string()),
        documentEmbeddings: v.optional(v.array(v.float64())),
        parentProject: v.optional(v.id("projects")),
    },
    async handler(ctx, args) {
        // Retrieve the authenticated user's identity
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("User not authenticated.");
        }

		const userDoc = await getStableUserDoc(ctx);

        // Validate if parentProject exists
        if (args.parentProject) {
            const project = await ctx.db.get(args.parentProject);
            if (!project) {
                throw new Error("Associated parent project not found.");
            }
        }

        // Insert the document with userId and other required fields
        const documentId = await ctx.db.insert('projects', {
			  type: 'document', // Set the type to 'document'
              userId: userDoc._id,
              isArchived: false,
              isPublished: false,
              parentProject: args.parentProject ?? null,

			  // Document Fields
			  documentTitle: args.documentTitle,
			  fileId: args.fileId,
			  contentType: args.contentType, // Storing the MIME type
      		  fileName: args.fileName,  
			  isProcessing: true, // Start processing
			  progress: 0,        // Initial progress

			  // Project Fields (set to undefined)
			  title: undefined,
			  content: undefined,
			  noteEmbeddings: undefined,
			  isProcessed: false,
    });

	// Schedule the document processing as an internal action
    {/* await ctx.scheduler.runAfter(0, api.projects.processDocument, {
		documentId,
	  }); */}

    return { documentId };
			  // Schedule a job to process the document
			  // await ctx.scheduler.runAfter(0, api.projects.processDocument, {
				//  documentId,
			  // });
    },
});

export const updateProcessingStatus = mutation({
	args: {
	  documentId: v.id("projects"),
	  isProcessed: v.optional(v.boolean()),
	  isProcessing: v.optional(v.boolean()),
	  processedAt: v.optional(v.string()),
	  progress: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
	  const updateFields: Partial<Doc<"projects">> = {};
  
	  if (args.isProcessing !== undefined) {
		updateFields.isProcessing = args.isProcessing;
	  }
  
	  if (args.isProcessed !== undefined) {  // Added handling for isProcessed
		updateFields.isProcessed = args.isProcessed;
	  }
  
	  if (args.processedAt !== undefined) {
		updateFields.processedAt = args.processedAt;
	  }
  
	  if (args.progress !== undefined) {
		updateFields.progress = args.progress;
	  }
  
	  await ctx.db.patch(args.documentId, updateFields);
	},
  });

// Get signed URL for a file
export const getFileUrl = mutation({
	args: { fileId: v.id("_storage") },
	handler: async (ctx, { fileId }) => {
	  const url = await ctx.storage.getUrl(fileId);
	  if (!url) {
		throw new Error("Failed to retrieve file URL from storage.");
	  }
	  return { url };
	},
  });

  // Update Document Content
  export const updateDocumentContent = mutation({
	args: {
	  documentId: v.id("projects"),
	  documentContent: v.string(),
	},
	handler: async (ctx, { documentId, documentContent }) => {
	  // Ensure user authentication or implement access controls if needed
	  await ctx.db.patch(documentId, {
		isProcessed: false, // reset or ensure it's false if needed
	  });
	},
  });

  // Update Document Chunks
  {/* export const updateDocumentChunks = mutation({
	args: {
	  documentId: v.id("projects"),
	  documentChunks: v.array(v.string()),
	},
	handler: async (ctx, { documentId, documentChunks }) => {
	  // Ensure user authentication or implement access controls if needed
	  await ctx.db.patch(documentId, {
		documentChunks: documentChunks,
		isProcessed: false, // reset or ensure it's false if needed
	  });
	},
  }); */}

export const getDocument = query({
	args: { documentId: v.id("projects") },
	handler: async (ctx, args) => {
	  return await ctx.db.get(args.documentId);
	},
  });

  export const getDocumentContent = query({
	args: {
	  documentId: v.id("projects"),
	},
	handler: async (ctx, { documentId }) => {
	  // Fetch the document from the `projects` table
	  const doc = await ctx.db.get(documentId);
	  if (!doc) {
		throw new Error(`Document with ID ${documentId} not found`);
	  }
	  // Return plain text
	  return {
		content: doc.content ?? "",
	  };
	},
  });

  export const updateDocumentProcessed = mutation({
	args: {
	  documentId: v.id("projects"),
	  isProcessed: v.boolean()
	},
	handler: async (ctx, args) => {
	  await ctx.db.patch(args.documentId, {
		isProcessed: args.isProcessed,
		processedAt: new Date().toISOString(),
	  });
	},
  });

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const getDocuments = query({
    async handler(ctx) {
	return await ctx.db.query('projects').collect()
    },
})

export const getDocumentsByProjectId = query({
	args: { projectId: v.id("projects") },
	handler: async (ctx, args) => {
	  const identity = await ctx.auth.getUserIdentity();
	  if (!identity) {
		throw new Error("User Not Authenticated.");
	  }

	  const userDoc = await getStableUserDoc(ctx);

	  const documents = await ctx.db
		.query("projects")
		.withIndex("by_user_parent", (q) =>
			q.eq("userId", userDoc._id).eq("parentProject", args.projectId)
		)
		.filter((q) =>
		  q.and(
			q.eq(q.field("isArchived"), false),
			q.eq(q.field("type"), "document")
		  )
		)
		.collect();

	  return documents;
	},
  });

export const archive = mutation({
	args: { id: v.id("projects") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new Error("User Not Authenticated.");
		}

		const userDoc = await getStableUserDoc(ctx);
		const existingProject = await ctx.db.get(args.id);

		if (!existingProject) {
			throw new Error("No Existing Projects.");
		}

		if (existingProject.userId !== userDoc._id) {
			throw new Error("User not Authorized to Modify Projects.");
		}

		const recursiveArchive = async (projectId: Id<"projects">) => {
			const children = await ctx.db
			.query("projects")
			.withIndex("by_user_parent", (q) => (
				q
				.eq("userId", userDoc._id)
				.eq("parentProject", projectId)
			))
			.collect();

			for (const child of children) {
				await ctx.db.patch(child._id, {
					isArchived: true,
				});

				await recursiveArchive(child._id);
			}
		}

		const project = await ctx.db.patch(args.id, {
			isArchived: true,
		});

		recursiveArchive(args.id);

		return project;
	}
})

/**
 * getSidebar: Return projects for the current user & optional parentProject.
 * We chain eq() calls inside `withIndex` so that TypeScript knows the fields match the index.
 */
export const getSidebar = query({
	args: {
	  parentProject: v.optional(v.id("projects")), // or undefined means top-level
	},
	handler: async (ctx, { parentProject }) => {
	  const identity = await ctx.auth.getUserIdentity();
	  if (!identity) {
		throw new Error("User not authenticated.");
	  }
  
	  // stable user ID
	  const stableUserIdString = identity.subject.split("|")[0];
	  const userDoc = await ctx.db.get(stableUserIdString as Id<"users">);
	  if (!userDoc) {
		console.error(`User doc not found for id=${stableUserIdString}`);
		return [];
	  }
  
	  // Use withIndex to match userId & parentProject, then order
	  // Because `by_user_parent` covers both "userId" and "parentProject",
	  // we do these eq() calls inside the same callback.
	  let q = ctx.db.query("projects").withIndex("by_user_parent", (q) =>
		q
		  .eq("userId", userDoc._id)
		  .eq("parentProject", parentProject ?? null)
		  // you can do .order("desc") right here in the callback
		  // .order("desc")
	  );
  
	  // Now we can chain a filter
	  q = q.filter((q) =>
		q.and(
		  q.eq(q.field("isArchived"), false),
		  q.eq(q.field("type"), "project")
		)
	  );
  
	  const projects = await q.collect();
	  console.log("getSidebar returned", projects.length, "projects.");
	  return projects;
	},
  });

  export const create = mutation({
	args: {
	  title: v.string(),
	  parentProject: v.optional(v.id("projects")),
	  content: v.optional(v.string()),
	  isPublished: v.optional(v.boolean()),
	  embeddings: v.optional(v.array(v.number())),
	  documentTitle: v.optional(v.string()),
	  fileId: v.optional(v.string()),
	  documentContent: v.optional(v.string()),
	  documentEmbeddings: v.optional(v.array(v.float64())),
	},
	handler: async (ctx, args) => {
	  // 1. Get the stable userDoc
	  const userDoc = await getStableUserDoc(ctx);
	  const stableUserId = userDoc._id;
  
	  // 2. Insert a new "project" doc
	  const projectPayload = {
		type: "project",
		title: args.title,
		// If no parentProject is provided, store null
		parentProject: args.parentProject ?? null,
		userId: stableUserId,
		isArchived: false,
		isPublished: args.isPublished ?? false,
		content: args.content,
		noteEmbeddings: args.embeddings,
		documentTitle: args.documentTitle,
		fileId: args.fileId,
		isProcessed: false,
	  };
  
	  const projectId = await ctx.db.insert("projects", projectPayload);
	  return projectId;
	},
  });
  

export const getTrash = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new Error("User Not Authenticated.");
		}

		const userDoc = await getStableUserDoc(ctx);

		const projects = await ctx.db
		.query("projects")
		.withIndex("by_user", (q) => q.eq("userId", userDoc._id))
		.filter((q) =>
			q.eq(q.field("isArchived"), true),
			)
			.order("desc")
			.collect();

		return projects;
	}
});

export const restore = mutation({
	args: { id: v.id("projects") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new Error("User Not Authenticated.");
		}

		const userDoc = await getStableUserDoc(ctx);

		const existingProject = await ctx.db.get(args.id);

		if (!existingProject) {
			throw new Error("Project Not Found.");
		}

		if (existingProject.userId !== userDoc._id) {
			throw new Error("User not Authorized.")
		}

		const recursiveRestore = async (projectId: Id<"projects">) => {
			const children = await ctx.db
			.query("projects")
			.withIndex("by_user_parent", (q) => (
				q
				.eq("userId", userDoc._id)
				.eq("parentProject", projectId)
			))
			.collect();

			for (const child of children) {
			await ctx.db.patch(child._id, {
				isArchived: false,
			});

			await recursiveRestore(child._id);
			}
		}

		const options: Partial<Doc<"projects">> = {
			isArchived: false,
		};

		if (existingProject.parentProject) {
			const parent = await ctx.db.get(existingProject.parentProject);
			if (parent?.isArchived) {
				options.parentProject = undefined;
			}
		}

		const project = await ctx.db.patch(args.id, options);

		recursiveRestore(args.id);

		return project;
	}
});

export const remove = mutation({
	args: { id: v.id("projects") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new Error("User Not Authenticated.");
		}

		const userDoc = await getStableUserDoc(ctx);

		const existingProject = await ctx.db.get(args.id);

		if (!existingProject) {
			throw new Error("Not Found.");
		}

		if (existingProject.userId !== userDoc._id) {
			throw new Error("User not Authorized.");
		}

		const project = await ctx.db.delete(args.id);

		return project;
	}
});

export const getSearch = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new Error("User Not Authenticated.");
		}

		const userDoc = await getStableUserDoc(ctx);

		const projects = await ctx.db
		.query("projects")
		.withIndex("by_user", (q) => q.eq("userId", userDoc._id))
		.filter((q) =>
		q.eq(q.field("isArchived"), false),
		)
		.order("desc")
		.collect()
		
		return projects;
	}
});

export const getById = query({
	args: { projectId: v.optional(v.id("projects")) },
	handler: async (ctx, args) => {
	  if (!args.projectId) {
		return null;
	  }
	  
	  const project = await ctx.db.get(args.projectId);
	  if (!project) {
		throw new Error("Not found");
	  }
	  // If published and not archived, no auth check is required.
	  if (project.isPublished && !project.isArchived) {
		return project;
	  }
	  
	  // Use the stable user doc instead of identity.subject
	  const userDoc = await getStableUserDoc(ctx);
	  if (project.userId !== userDoc._id) {
		throw new Error("Unauthorized");
	  }
	  return project;
	},
  });

  export const update = mutation({
	args: {
	  id: v.id("projects"),
	  title: v.optional(v.string()),
	  content: v.optional(v.string()),
	  icon: v.optional(v.string()),
	  isPublished: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
	  // Retrieve the stable user document.
	  const userDoc = await getStableUserDoc(ctx);
	  const stableUserId = userDoc._id;
  
	  // Destructure the project id from the rest of the arguments.
	  const { id, ...rest } = args;
  
	  // Fetch the existing project.
	  const existingProject = await ctx.db.get(id);
	  if (!existingProject) {
		throw new Error("Not found");
	  }
  
	  // Compare using the stable user ID.
	  if (existingProject.userId !== stableUserId) {
		throw new Error("Unauthorized");
	  }
  
	  // Update the project.
	  const project = await ctx.db.patch(id, { ...rest });
	  return project;
	},
  });

  export const createTask = mutation({
	args: {
	  taskTitle: v.string(),
	  taskDescription: v.optional(v.string()),
	  taskStatus: v.optional(
		v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"))
	  ),
	  taskPriority: v.optional(
		v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
	  ),
	  taskDueDate: v.optional(v.string()),
	  taskEmbeddings: v.optional(v.array(v.float64())),
	  // New fields for time, recurrence, and calendar display
	  taskStartTime: v.optional(v.string()),
	  taskEndTime: v.optional(v.string()),
	  taskAllDay: v.optional(v.boolean()),
	  taskRecurring: v.optional(v.boolean()),
	  taskRecurrencePattern: v.optional(
		v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))
	  ),
	  taskRecurrenceEnd: v.optional(v.string()),
	  taskColor: v.optional(v.string()),
	  taskReminder: v.optional(v.number()),
	  parentProject: v.id("projects"),
	},
	async handler(ctx, args) {
	  const identity = await ctx.auth.getUserIdentity();
	  if (!identity) throw new Error("User not authenticated.");

	  const userDoc = await getStableUserDoc(ctx);

	  const project = await ctx.db.get(args.parentProject);
	  if (!project || project.type !== "project") {
		throw new Error("Invalid or missing parent project.");
	  }

	  const taskId = await ctx.db.insert("projects", {
		type: "task",
		userId: userDoc._id,
		isArchived: false,
		parentProject: args.parentProject,
		isPublished: false,

		taskTitle: args.taskTitle,
		taskDescription: args.taskDescription,
		taskStatus: args.taskStatus ?? "pending",
		taskPriority: args.taskPriority ?? "medium",
		taskDueDate: args.taskDueDate,
		taskEmbeddings: args.taskEmbeddings,

		// New task fields for calendar functionality
		taskStartTime: args.taskStartTime,
		taskEndTime: args.taskEndTime,
		taskAllDay: args.taskAllDay,
		taskRecurring: args.taskRecurring,
		taskRecurrencePattern: args.taskRecurrencePattern,
		taskRecurrenceEnd: args.taskRecurrenceEnd,
		taskColor: args.taskColor,
		taskReminder: args.taskReminder,

		// Document-specific fields (left undefined for tasks)
		documentTitle: undefined,
		fileId: undefined,
		contentType: undefined,
		fileName: undefined,
		isProcessing: undefined,
		progress: undefined,
		title: undefined,
		content: undefined,
		noteEmbeddings: undefined,
		isProcessed: undefined,
	  });

	  return { taskId };
	},
  });

  export const updateTask = mutation({
	args: {
	  id: v.id("projects"),
	  taskTitle: v.optional(v.string()),
	  taskDescription: v.optional(v.string()),
	  taskStatus: v.optional(
		v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"))
	  ),
	  // New fields for updating calendar-specific details
	  taskStartTime: v.optional(v.string()),
	  taskEndTime: v.optional(v.string()),
	  taskAllDay: v.optional(v.boolean()),
	  taskRecurring: v.optional(v.boolean()),
	  taskRecurrencePattern: v.optional(
		v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))
	  ),
	  taskRecurrenceEnd: v.optional(v.string()),
	  taskColor: v.optional(v.string()),
	  taskReminder: v.optional(v.number()),
	},
	async handler(ctx, args) {
	  const existingProject = await ctx.db.get(args.id);
	  if (!existingProject) {
		throw new Error("Task not found.");
	  }

	  const userDoc = await getStableUserDoc(ctx);

	  if (existingProject.userId !== userDoc._id) {
		throw new Error("Unauthorized.");
	  }

	  await ctx.db.patch(args.id, {
		...(args.taskTitle !== undefined && { taskTitle: args.taskTitle }),
		...(args.taskDescription !== undefined && { taskDescription: args.taskDescription }),
		...(args.taskStatus !== undefined && { taskStatus: args.taskStatus }),
		...(args.taskStartTime !== undefined && { taskStartTime: args.taskStartTime }),
		...(args.taskEndTime !== undefined && { taskEndTime: args.taskEndTime }),
		...(args.taskAllDay !== undefined && { taskAllDay: args.taskAllDay }),
		...(args.taskRecurring !== undefined && { taskRecurring: args.taskRecurring }),
		...(args.taskRecurrencePattern !== undefined && { taskRecurrencePattern: args.taskRecurrencePattern }),
		...(args.taskRecurrenceEnd !== undefined && { taskRecurrenceEnd: args.taskRecurrenceEnd }),
		...(args.taskColor !== undefined && { taskColor: args.taskColor }),
		...(args.taskReminder !== undefined && { taskReminder: args.taskReminder }),
	  });

	  return { success: true };
	},
  });

  export const getTasksByStatus = query({
	args: {
	  taskStatus: v.union(
		v.literal("pending"),
		v.literal("in_progress"),
		v.literal("completed")
	  )
	},
	async handler(ctx, args) {
	  const userDoc = await getStableUserDoc(ctx);
	  const tasks = await ctx.db
		.query("projects")
		.withIndex("by_user_taskStatus", (q) =>
		  q.eq("userId", userDoc._id).eq("taskStatus", args.taskStatus)
		)
		.filter((q) => q.eq(q.field("isArchived"), false))
		.collect();
	  return tasks;
	},
  });

  export const getTasksByProjectId = query({
  args: { parentProject: v.id("projects") },
  async handler(ctx, args) {
    const userDoc = await getStableUserDoc(ctx);
    return await ctx.db
      .query("projects")
      .withIndex("by_user_parent", (q) =>
        q.eq("userId", userDoc._id).eq("parentProject", args.parentProject)
      )
      .filter((q) => q.eq("type", "task"))
      .collect();
  },
});

  export const getTasksByParentProject = query({
	args: { parentProject: v.id("projects") },
	async handler(ctx, args) {
	  const userDoc = await getStableUserDoc(ctx);
	  return await ctx.db
		.query("projects")
		.withIndex("by_user_parent", (q) =>
		  q.eq("userId", userDoc._id).eq("parentProject", args.parentProject)
		)
		.filter((q) => q.eq("type", "task"))
		.collect();
	},
  });

  export const getUpcomingTasks = query({
	args: {
	  projectId: v.id("projects"),
	  limit: v.number(),
	},
	async handler(ctx, args) {
	  const userDoc = await getStableUserDoc(ctx);
	  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

	  // Query tasks for the given project and user,
	  // filter to tasks that have a due date on or after today and are not archived.
	  let tasks = await ctx.db
		.query("projects")
		.withIndex("by_user_parent", (q) =>
		  q.eq("userId", userDoc._id).eq("parentProject", args.projectId)
		)
		.filter((q) =>
		  q.and(
			q.eq("type", "task"),
			q.neq("taskDueDate", null),
			q.gte("taskDueDate", todayStr),
			q.eq(q.field("isArchived"), false)
		  )
		)
		.collect();

	  // Sort tasks by due date in ascending order.
	  tasks.sort((a, b) =>
		(a.taskDueDate || "").localeCompare(b.taskDueDate || "")
	  );

	  // Return the tasks up to the provided limit.
	  return tasks.slice(0, args.limit);
	},
  });

  export const getOverdueTasks = query({
	args: {
	  projectId: v.id("projects"),
	},
	async handler(ctx, args) {
	  const userDoc = await getStableUserDoc(ctx);
	  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

	  let tasks = await ctx.db
		.query("projects")
		.withIndex("by_user_parent", (q) =>
		  q.eq("userId", userDoc._id).eq("parentProject", args.projectId)
		)
		.filter((q) =>
		  q.and(
			q.eq("type", "task"),
			q.neq("taskDueDate", null),
			q.lt("taskDueDate", todayStr),
			q.eq(q.field("isArchived"), false)
		  )
		)
		.collect();

	  // Sort tasks by due date in ascending order
	  tasks.sort((a, b) =>
		(a.taskDueDate || "").localeCompare(b.taskDueDate || "")
	  );

	  return tasks;
	},
  });