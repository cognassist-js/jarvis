CREATE TABLE `calendar_connection` (
	`id` text PRIMARY KEY NOT NULL,
	`ics_url` text NOT NULL,
	`default_project_id` text,
	`sync_window_days` integer DEFAULT 14 NOT NULL,
	`last_synced_at` text,
	`last_sync_status` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`default_project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `source` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `external_id` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `meeting_start` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `meeting_end` text;--> statement-breakpoint
CREATE UNIQUE INDEX `tasks_external_id_unique` ON `tasks` (`external_id`);