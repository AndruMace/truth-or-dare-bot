CREATE TYPE "public"."prompt_status" AS ENUM('approved', 'pending', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."prompt_type" AS ENUM('truth', 'dare');--> statement-breakpoint
CREATE TABLE "prompt_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"message_id" text NOT NULL,
	"prompt_id" integer NOT NULL,
	"type" "prompt_type" NOT NULL,
	"author_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text,
	"type" "prompt_type" NOT NULL,
	"text" text NOT NULL,
	"status" "prompt_status" DEFAULT 'pending' NOT NULL,
	"submitted_by" text,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "score_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"prompt_message_id" integer NOT NULL,
	"reply_message_id" text NOT NULL,
	"points" integer NOT NULL,
	"type" "prompt_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"all_time_points" integer DEFAULT 0 NOT NULL,
	"weekly_points" integer DEFAULT 0 NOT NULL,
	"week_start" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prompt_messages" ADD CONSTRAINT "prompt_messages_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_events" ADD CONSTRAINT "score_events_prompt_message_id_prompt_messages_id_fk" FOREIGN KEY ("prompt_message_id") REFERENCES "public"."prompt_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_messages_message_id_idx" ON "prompt_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "prompt_messages_guild_message_idx" ON "prompt_messages" USING btree ("guild_id","message_id");--> statement-breakpoint
CREATE INDEX "prompts_guild_type_status_idx" ON "prompts" USING btree ("guild_id","type","status");--> statement-breakpoint
CREATE UNIQUE INDEX "score_events_reply_message_id_idx" ON "score_events" USING btree ("reply_message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "score_events_user_prompt_message_idx" ON "score_events" USING btree ("user_id","prompt_message_id");--> statement-breakpoint
CREATE INDEX "score_events_guild_created_idx" ON "score_events" USING btree ("guild_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_scores_guild_user_idx" ON "user_scores" USING btree ("guild_id","user_id");--> statement-breakpoint
CREATE INDEX "user_scores_guild_all_time_idx" ON "user_scores" USING btree ("guild_id","all_time_points");--> statement-breakpoint
CREATE INDEX "user_scores_guild_weekly_idx" ON "user_scores" USING btree ("guild_id","weekly_points");