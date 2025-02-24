/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as chunks from "../chunks.js";
import type * as graph from "../graph.js";
import type * as graphChat from "../graphChat.js";
import type * as http from "../http.js";
import type * as langchain_db from "../langchain/db.js";
import type * as lib_getUserOrThrow from "../lib/getUserOrThrow.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as projects from "../projects.js";
import type * as search from "../search.js";
import type * as usage from "../usage.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  chat: typeof chat;
  chunks: typeof chunks;
  graph: typeof graph;
  graphChat: typeof graphChat;
  http: typeof http;
  "langchain/db": typeof langchain_db;
  "lib/getUserOrThrow": typeof lib_getUserOrThrow;
  "lib/permissions": typeof lib_permissions;
  projects: typeof projects;
  search: typeof search;
  usage: typeof usage;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
