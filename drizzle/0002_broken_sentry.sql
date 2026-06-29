CREATE TABLE "prompt_cycle_used" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"type" "prompt_type" NOT NULL,
	"prompt_id" integer NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prompt_cycle_used" ADD CONSTRAINT "prompt_cycle_used_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_cycle_used_guild_type_prompt_idx" ON "prompt_cycle_used" USING btree ("guild_id","type","prompt_id");--> statement-breakpoint
CREATE INDEX "prompt_cycle_used_guild_type_idx" ON "prompt_cycle_used" USING btree ("guild_id","type");