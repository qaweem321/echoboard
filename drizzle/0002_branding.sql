ALTER TABLE "organizations" ADD COLUMN "brand_color" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "custom_domain" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "hide_powered_by" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_custom_domain_unique" UNIQUE("custom_domain");