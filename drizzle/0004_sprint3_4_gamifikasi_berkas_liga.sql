CREATE TABLE "case_file" (
	"user_id" text NOT NULL,
	"case_id" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"last_query" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "case_file_user_id_case_id_pk" PRIMARY KEY("user_id","case_id")
);
--> statement-breakpoint
CREATE TABLE "league_group" (
	"id" text PRIMARY KEY NOT NULL,
	"tier" text NOT NULL,
	"week_start" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league_member" (
	"group_id" text NOT NULL,
	"user_id" text NOT NULL,
	"xp_week" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "league_member_group_id_user_id_pk" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "mission_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"case_id" text NOT NULL,
	"node_key" text NOT NULL,
	"is_repeat" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"hints" integer DEFAULT 0 NOT NULL,
	"answered" integer DEFAULT 0 NOT NULL,
	"correct" integer DEFAULT 0 NOT NULL,
	"score" integer,
	"xp" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	CONSTRAINT "mission_attempt_hints_check" CHECK ("mission_attempt"."hints" between 0 and 3)
);
--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "hearts" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "hearts_updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "coins" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "lantern" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "last_mission_date" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "league_tier" text DEFAULT 'Safir' NOT NULL;--> statement-breakpoint
ALTER TABLE "case_file" ADD CONSTRAINT "case_file_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_file" ADD CONSTRAINT "case_file_case_id_case_content_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case_content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_member" ADD CONSTRAINT "league_member_group_id_league_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."league_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_member" ADD CONSTRAINT "league_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_attempt" ADD CONSTRAINT "mission_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_attempt" ADD CONSTRAINT "mission_attempt_case_id_case_content_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case_content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "league_group_tier_week_idx" ON "league_group" USING btree ("tier","week_start");--> statement-breakpoint
CREATE INDEX "league_member_group_xp_idx" ON "league_member" USING btree ("group_id","xp_week");--> statement-breakpoint
CREATE INDEX "mission_attempt_user_finished_idx" ON "mission_attempt" USING btree ("user_id","finished_at");