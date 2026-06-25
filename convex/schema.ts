import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  outlets: defineTable({
    externalId: v.string(),
    name: v.string(),
    domain: v.string(),
    biasLabel: v.string(),
    factuality: v.string(),
    ratingSource: v.optional(v.string()),
  }).index('by_externalId', ['externalId']),

  feeds: defineTable({
    externalId: v.string(),
    outletId: v.id('outlets'),
    url: v.string(),
    pollIntervalSec: v.number(),
    lastEtag: v.optional(v.string()),
    lastModified: v.optional(v.string()),
    lastFetchedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    enabled: v.boolean(),
  })
    .index('by_externalId', ['externalId'])
    .index('by_url', ['url']),

  articles: defineTable({
    feedId: v.id('feeds'),
    outletId: v.id('outlets'),
    guid: v.string(),
    url: v.string(),
    title: v.string(),
    summary: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    fetchedAt: v.number(),
    contentHash: v.string(),
  })
    .index('by_feed_guid', ['feedId', 'guid'])
    .index('by_published', ['publishedAt']),

  storyClusters: defineTable({
    canonicalTitle: v.string(),
    slug: v.string(),
    firstSeenAt: v.number(),
    lastUpdatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_lastUpdated', ['lastUpdatedAt']),

  storyArticles: defineTable({
    storyId: v.id('storyClusters'),
    articleId: v.id('articles'),
    relevanceScore: v.optional(v.number()),
  })
    .index('by_story', ['storyId'])
    .index('by_article', ['articleId']),

  userFollows: defineTable({
    userId: v.string(),
    outletId: v.id('outlets'),
  })
    .index('by_user', ['userId'])
    .index('by_user_outlet', ['userId', 'outletId']),

  userBiasProfile: defineTable({
    userId: v.string(),
    selfReportedLean: v.optional(v.string()),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  subscriptions: defineTable({
    userId: v.string(),
    plan: v.string(),
    status: v.string(),
    razorpayCustomerId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
  }).index('by_user', ['userId']),

  verifications: defineTable({
    userId: v.optional(v.string()),
    storyId: v.optional(v.id('storyClusters')),
    contentHash: v.string(),
    veracity: v.string(),
    confidence: v.number(),
    resultJson: v.string(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_created', ['userId', 'createdAt']),
});