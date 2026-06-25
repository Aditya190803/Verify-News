import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';

export const outlets = pgTable('outlets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  domain: text('domain').notNull(),
  biasLabel: text('bias_label').notNull().default('unknown'),
  factuality: text('factuality').notNull().default('unknown'),
  ratingSource: text('rating_source'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const feeds = pgTable('feeds', {
  id: text('id').primaryKey(),
  outletId: text('outlet_id')
    .notNull()
    .references(() => outlets.id),
  url: text('url').notNull().unique(),
  pollIntervalSec: integer('poll_interval_sec').notNull().default(900),
  lastEtag: text('last_etag'),
  lastModified: text('last_modified'),
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
  lastError: text('last_error'),
  enabled: boolean('enabled').notNull().default(true),
});

export const articles = pgTable(
  'articles',
  {
    id: text('id').primaryKey(),
    feedId: text('feed_id')
      .notNull()
      .references(() => feeds.id),
    outletId: text('outlet_id')
      .notNull()
      .references(() => outlets.id),
    guid: text('guid').notNull(),
    url: text('url').notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    contentHash: text('content_hash').notNull(),
  },
  (t) => [
    index('articles_feed_guid_idx').on(t.feedId, t.guid),
    index('articles_published_idx').on(t.publishedAt),
  ],
);

export const storyClusters = pgTable('story_clusters', {
  id: text('id').primaryKey(),
  canonicalTitle: text('canonical_title').notNull(),
  slug: text('slug').notNull().unique(),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull(),
  lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }).notNull(),
});

export const storyArticles = pgTable(
  'story_articles',
  {
    storyId: text('story_id')
      .notNull()
      .references(() => storyClusters.id),
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id),
    relevanceScore: integer('relevance_score').default(100),
  },
  (t) => [primaryKey({ columns: [t.storyId, t.articleId] })],
);

export const userFollows = pgTable(
  'user_follows',
  {
    userId: text('user_id').notNull(),
    outletId: text('outlet_id')
      .notNull()
      .references(() => outlets.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.outletId] })],
);

export const userBiasProfile = pgTable('user_bias_profile', {
  userId: text('user_id').primaryKey(),
  selfReportedLean: text('self_reported_lean'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  userId: text('user_id').primaryKey(),
  stripeCustomerId: text('stripe_customer_id'),
  plan: text('plan').notNull().default('free'),
  status: text('status').notNull().default('active'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  storyId: text('story_id').references(() => storyClusters.id),
  contentHash: text('content_hash').notNull(),
  veracity: text('veracity').notNull(),
  confidence: integer('confidence').notNull(),
  resultJson: text('result_json').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});