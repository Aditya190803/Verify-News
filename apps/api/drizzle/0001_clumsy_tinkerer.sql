CREATE TABLE "subscriptions" (
	"user_id" text PRIMARY KEY NOT NULL,
	"stripe_customer_id" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_end" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_bias_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"self_reported_lean" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_follows" (
	"user_id" text NOT NULL,
	"outlet_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_follows_user_id_outlet_id_pk" PRIMARY KEY("user_id","outlet_id")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"story_id" text,
	"content_hash" text NOT NULL,
	"veracity" text NOT NULL,
	"confidence" integer NOT NULL,
	"result_json" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_story_id_story_clusters_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story_clusters"("id") ON DELETE no action ON UPDATE no action;