CREATE TABLE "case_content" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"number" text NOT NULL,
	"title" text NOT NULL,
	"body" jsonb NOT NULL,
	CONSTRAINT "case_content_course_number_key" UNIQUE("course_id","number")
);
--> statement-breakpoint
CREATE TABLE "course" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"abbr" text NOT NULL,
	"color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_progress" (
	"user_id" text NOT NULL,
	"case_id" text NOT NULL,
	"node_key" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "node_progress_user_id_case_id_node_key_pk" PRIMARY KEY("user_id","case_id","node_key")
);
--> statement-breakpoint
ALTER TABLE "case_content" ADD CONSTRAINT "case_content_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_progress" ADD CONSTRAINT "node_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_progress" ADD CONSTRAINT "node_progress_case_id_case_content_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case_content"("id") ON DELETE cascade ON UPDATE no action;