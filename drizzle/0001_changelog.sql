CREATE TABLE "changelog_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "changelog_entry_posts" (
	"entry_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	CONSTRAINT "changelog_entry_posts_entry_id_post_id_pk" PRIMARY KEY("entry_id","post_id")
);
--> statement-breakpoint
ALTER TABLE "voters" ADD COLUMN "unsubscribed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "changelog_entries" ADD CONSTRAINT "changelog_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changelog_entry_posts" ADD CONSTRAINT "changelog_entry_posts_entry_id_changelog_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."changelog_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changelog_entry_posts" ADD CONSTRAINT "changelog_entry_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "changelog_organization_published_idx" ON "changelog_entries" USING btree ("organization_id","published_at");--> statement-breakpoint
CREATE INDEX "changelog_entry_posts_post_idx" ON "changelog_entry_posts" USING btree ("post_id");