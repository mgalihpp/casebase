CREATE TABLE "node_failure" (
	"user_id" text NOT NULL,
	"case_id" text NOT NULL,
	"node_key" text NOT NULL,
	"failed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "node_failure_user_id_case_id_node_key_pk" PRIMARY KEY("user_id","case_id","node_key")
);
--> statement-breakpoint
ALTER TABLE "node_failure" ADD CONSTRAINT "node_failure_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_failure" ADD CONSTRAINT "node_failure_case_id_case_content_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case_content"("id") ON DELETE cascade ON UPDATE no action;