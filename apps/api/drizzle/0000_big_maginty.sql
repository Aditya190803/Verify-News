CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"feed_id" text NOT NULL,
	"outlet_id" text NOT NULL,
	"guid" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone NOT NULL,
	"content_hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feeds" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text NOT NULL,
	"url" text NOT NULL,
	"poll_interval_sec" integer DEFAULT 900 NOT NULL,
	"last_etag" text,
	"last_modified" text,
	"last_fetched_at" timestamp with time zone,
	"last_error" text,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "feeds_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "outlets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"bias_label" text DEFAULT 'unknown' NOT NULL,
	"factuality" text DEFAULT 'unknown' NOT NULL,
	"rating_source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_articles" (
	"story_id" text NOT NULL,
	"article_id" text NOT NULL,
	"relevance_score" integer DEFAULT 100,
	CONSTRAINT "story_articles_story_id_article_id_pk" PRIMARY KEY("story_id","article_id")
);
--> statement-breakpoint
CREATE TABLE "story_clusters" (
	"id" text PRIMARY KEY NOT NULL,
	"canonical_title" text NOT NULL,
	"slug" text NOT NULL,
	"first_seen_at" timestamp with time zone NOT NULL,
	"last_updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "story_clusters_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_articles" ADD CONSTRAINT "story_articles_story_id_story_clusters_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story_clusters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_articles" ADD CONSTRAINT "story_articles_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "articles_feed_guid_idx" ON "articles" USING btree ("feed_id","guid");--> statement-breakpoint
CREATE INDEX "articles_published_idx" ON "articles" USING btree ("published_at");