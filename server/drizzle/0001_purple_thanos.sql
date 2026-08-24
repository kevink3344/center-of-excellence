CREATE TABLE `cab_members` (
	`user_id` text NOT NULL,
	`member_type` text DEFAULT 'cab_member' NOT NULL,
	PRIMARY KEY(`user_id`, `member_type`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `change_approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`change_id` text NOT NULL,
	`approver_id` text NOT NULL,
	`stage` integer DEFAULT 1,
	`role_label` text,
	`decision` text DEFAULT 'pending' NOT NULL,
	`comment` text,
	`decidedAt` text,
	FOREIGN KEY (`change_id`) REFERENCES `change_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `change_approvals_change_idx` ON `change_approvals` (`change_id`);--> statement-breakpoint
CREATE TABLE `change_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text DEFAULT 'normal' NOT NULL,
	`category` text DEFAULT 'application' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`risk` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`reason` text,
	`implementation_plan` text,
	`rollback_plan` text,
	`test_plan` text,
	`project_id` text,
	`requested_by` text,
	`service_owner` text,
	`plannedStartAt` text,
	`plannedEndAt` text,
	`actualStartAt` text,
	`actualEndAt` text,
	`implementedAt` text,
	`created_at` text DEFAULT '(datetime(''now''))',
	`updatedAt` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_owner`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `change_requests_project_idx` ON `change_requests` (`project_id`);--> statement-breakpoint
CREATE INDEX `change_requests_status_idx` ON `change_requests` (`status`);--> statement-breakpoint
CREATE TABLE `change_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`change_id` text NOT NULL,
	`title` text NOT NULL,
	`assignee_id` text,
	`status` text DEFAULT 'todo' NOT NULL,
	`position` integer DEFAULT 0,
	FOREIGN KEY (`change_id`) REFERENCES `change_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `change_tasks_change_idx` ON `change_tasks` (`change_id`);--> statement-breakpoint
CREATE TABLE `change_windows` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'window' NOT NULL,
	`startAt` text NOT NULL,
	`endAt` text NOT NULL,
	`scope` text
);
--> statement-breakpoint
CREATE INDEX `change_windows_dates_idx` ON `change_windows` (`startAt`,`endAt`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text,
	`title` text NOT NULL,
	`body` text,
	`entity_type` text,
	`entity_id` text,
	`read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT '(datetime(''now''))',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`,`read`);