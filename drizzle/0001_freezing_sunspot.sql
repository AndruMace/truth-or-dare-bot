CREATE TABLE "blocked_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"prompt_id" integer NOT NULL,
	"blocked_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blocked_prompts" ADD CONSTRAINT "blocked_prompts_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blocked_prompts_guild_prompt_idx" ON "blocked_prompts" USING btree ("guild_id","prompt_id");--> statement-breakpoint
CREATE INDEX "blocked_prompts_guild_idx" ON "blocked_prompts" USING btree ("guild_id");