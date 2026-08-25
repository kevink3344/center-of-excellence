CREATE TABLE `application_ideas` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`title` text NOT NULL,
	`idea_text` text NOT NULL,
	`model` text,
	`user_class` text NOT NULL,
	`app_size` text NOT NULL,
	`audience` text NOT NULL,
	`connectivity` integer DEFAULT false NOT NULL,
	`design` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_project_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
	`updatedAt` text,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`published_project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `application_ideas_author_idx` ON `application_ideas` (`author_id`);--> statement-breakpoint
CREATE INDEX `application_ideas_status_idx` ON `application_ideas` (`status`);