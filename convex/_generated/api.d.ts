/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as billing from "../billing.js";
import type * as billingActions from "../billingActions.js";
import type * as crons from "../crons.js";
import type * as follows from "../follows.js";
import type * as health from "../health.js";
import type * as lib_aggregationTypes from "../lib/aggregationTypes.js";
import type * as lib_bias from "../lib/bias.js";
import type * as lib_blindspot from "../lib/blindspot.js";
import type * as lib_cluster from "../lib/cluster.js";
import type * as lib_entitlements from "../lib/entitlements.js";
import type * as lib_plans from "../lib/plans.js";
import type * as lib_slug from "../lib/slug.js";
import type * as lib_storyBuild from "../lib/storyBuild.js";
import type * as outlets from "../outlets.js";
import type * as rss from "../rss.js";
import type * as rssMutations from "../rssMutations.js";
import type * as rssQueries from "../rssQueries.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
import type * as stories from "../stories.js";
import type * as verifications from "../verifications.js";
import type * as verify from "../verify.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  billing: typeof billing;
  billingActions: typeof billingActions;
  crons: typeof crons;
  follows: typeof follows;
  health: typeof health;
  "lib/aggregationTypes": typeof lib_aggregationTypes;
  "lib/bias": typeof lib_bias;
  "lib/blindspot": typeof lib_blindspot;
  "lib/cluster": typeof lib_cluster;
  "lib/entitlements": typeof lib_entitlements;
  "lib/plans": typeof lib_plans;
  "lib/slug": typeof lib_slug;
  "lib/storyBuild": typeof lib_storyBuild;
  outlets: typeof outlets;
  rss: typeof rss;
  rssMutations: typeof rssMutations;
  rssQueries: typeof rssQueries;
  seed: typeof seed;
  seedData: typeof seedData;
  stories: typeof stories;
  verifications: typeof verifications;
  verify: typeof verify;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
