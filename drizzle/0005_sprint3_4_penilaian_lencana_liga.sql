CREATE TABLE "check_rate" (
	"user_id" text NOT NULL,
	"minute" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "check_rate_user_id_minute_pk" PRIMARY KEY("user_id","minute")
);
--> statement-breakpoint
CREATE TABLE "chest_open" (
	"user_id" text NOT NULL,
	"case_id" text NOT NULL,
	"node_key" text NOT NULL,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chest_open_user_id_case_id_node_key_pk" PRIMARY KEY("user_id","case_id","node_key")
);
--> statement-breakpoint
CREATE TABLE "mission_hint" (
	"attempt_id" text NOT NULL,
	"question_key" text NOT NULL,
	"hint_index" integer NOT NULL,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mission_hint_attempt_id_question_key_hint_index_pk" PRIMARY KEY("attempt_id","question_key","hint_index")
);
--> statement-breakpoint
CREATE TABLE "user_badge" (
	"user_id" text NOT NULL,
	"badge_key" text NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_badge_user_id_badge_key_pk" PRIMARY KEY("user_id","badge_key")
);
--> statement-breakpoint
ALTER TABLE "mission_attempt" DROP CONSTRAINT "mission_attempt_hints_check";--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "league_tier" SET DEFAULT 'Perunggu';--> statement-breakpoint
ALTER TABLE "league_group" ADD COLUMN "closed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mission_attempt" ADD COLUMN "fast_correct" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "mission_attempt" ADD COLUMN "last_event_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "check_rate" ADD CONSTRAINT "check_rate_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chest_open" ADD CONSTRAINT "chest_open_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chest_open" ADD CONSTRAINT "chest_open_case_id_case_content_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case_content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_hint" ADD CONSTRAINT "mission_hint_attempt_id_mission_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."mission_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badge" ADD CONSTRAINT "user_badge_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;