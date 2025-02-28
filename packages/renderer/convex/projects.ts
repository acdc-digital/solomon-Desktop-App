// Convex Projects 
// /Users/matthewsimon/Documents/GitHub/solomon-electron/solomon-electron/next/convex/projects.ts

import { v } from "convex/values";
import { getStableUserDoc } from "./lib/getUserOrThrow";
import { mutation, MutationCtx, query, internalAction, ActionCtx, action } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { UnstructuredLoader } from "@langchain/community/document_loaders/fs/unstructured";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CacheBackedEmbeddings } from "langchain/embeddings/cache_backed";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ConvexKVStore } from "@langchain/community/storage/convex";
import { ConvexVectorStore } from "@langchain/community/vectorstores/convex";
import fetch from "node-fetch";
// import pdfParse from 'pdf-parse';
// import OpenAI from "openai";

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