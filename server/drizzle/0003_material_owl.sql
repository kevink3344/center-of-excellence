PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ai_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`feature` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`provider` text,
	`model` text,
	`prompt_version` text,
	`input_tokens` integer,
	`output_tokens` integer,
	`latency_ms` integer,
	`status` text DEFAULT 'ok' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
--> statement-breakpoint
INSERT INTO `__new_ai_audit_logs`("id", "feature", "entity_type", "entity_id", "provider", "model", "prompt_version", "input_tokens", "output_tokens", "latency_ms", "status", "created_at") SELECT "id", "feature", "entity_type", "entity_id", "provider", "model", "prompt_version", "input_tokens", "output_tokens", "latency_ms", "status", CASE WHEN "created_at" = '(datetime(''now''))' THEN strftime('%Y-%m-%dT%H:%M:%SZ', 'now') ELSE "created_at" END FROM `ai_audit_logs`;--> statement-breakpoint
DROP TABLE `ai_audit_logs`;--> statement-breakpoint
ALTER TABLE `__new_ai_audit_logs` RENAME TO `ai_audit_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `ai_audit_feature_idx` ON `ai_audit_logs` (`feature`);--> statement-breakpoint
CREATE TABLE `__new_ai_insights` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`kind` text NOT NULL,
	`content` text NOT NULL,
	`reasoning` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_ai_insights`("id", "entity_type", "entity_id", "kind", "content", "reasoning", "status", "created_by", "created_at") SELECT "id", "entity_type", "entity_id", "kind", "content", "reasoning", "status", "created_by", CASE WHEN "created_at" = '(datetime(''now''))' THEN strftime('%Y-%m-%dT%H:%M:%SZ', 'now') ELSE "created_at" END FROM `ai_insights`;--> statement-breakpoint
DROP TABLE `ai_insights`;--> statement-breakpoint
ALTER TABLE `__new_ai_insights` RENAME TO `ai_insights`;--> statement-breakpoint
CREATE INDEX `ai_insights_entity_idx` ON `ai_insights` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `__new_change_requests` (
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
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
	`updatedAt` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_owner`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_change_requests`("id", "title", "description", "type", "category", "priority", "risk", "status", "reason", "implementation_plan", "rollback_plan", "test_plan", "project_id", "requested_by", "service_owner", "plannedStartAt", "plannedEndAt", "actualStartAt", "actualEndAt", "implementedAt", "created_at", "updatedAt") SELECT "id", "title", "description", "type", "category", "priority", "risk", "status", "reason", "implementation_plan", "rollback_plan", "test_plan", "project_id", "requested_by", "service_owner", "plannedStartAt", "plannedEndAt", "actualStartAt", "actualEndAt", "implementedAt", CASE WHEN "created_at" = '(datetime(''now''))' THEN strftime('%Y-%m-%dT%H:%M:%SZ', 'now') ELSE "created_at" END, "updatedAt" FROM `change_requests`;--> statement-breakpoint
DROP TABLE `change_requests`;--> statement-breakpoint
ALTER TABLE `__new_change_requests` RENAME TO `change_requests`;--> statement-breakpoint
CREATE INDEX `change_requests_project_idx` ON `change_requests` (`project_id`);--> statement-breakpoint
CREATE INDEX `change_requests_status_idx` ON `change_requests` (`status`);--> statement-breakpoint
CREATE TABLE `__new_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`author_id` text,
	`body` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_comments`("id", "entity_type", "entity_id", "author_id", "body", "created_at") SELECT "id", "entity_type", "entity_id", "author_id", "body", CASE WHEN "created_at" = '(datetime(''now''))' THEN strftime('%Y-%m-%dT%H:%M:%SZ', 'now') ELSE "created_at" END FROM `comments`;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
ALTER TABLE `__new_comments` RENAME TO `comments`;--> statement-breakpoint
CREATE INDEX `comments_entity_idx` ON `comments` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `__new_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text,
	`title` text NOT NULL,
	`body` text,
	`entity_type` text,
	`entity_id` text,
	`read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_notifications`("id", "user_id", "kind", "title", "body", "entity_type", "entity_id", "read", "created_at") SELECT "id", "user_id", "kind", "title", "body", "entity_type", "entity_id", "read", CASE WHEN "created_at" = '(datetime(''now''))' THEN strftime('%Y-%m-%dT%H:%M:%SZ', 'now') ELSE "created_at" END FROM `notifications`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
ALTER TABLE `__new_notifications` RENAME TO `notifications`;--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`,`read`);--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'intake' NOT NULL,
	`priority` text,
	`score` integer DEFAULT 0 NOT NULL,
	`business_unit_id` text,
	`requestor_id` text,
	`pm_id` text,
	`budget` real,
	`startDate` text,
	`targetDate` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
	FOREIGN KEY (`business_unit_id`) REFERENCES `business_units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requestor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pm_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_projects`("id", "title", "description", "status", "priority", "score", "business_unit_id", "requestor_id", "pm_id", "budget", "startDate", "targetDate", "created_at") SELECT "id", "title", "description", "status", "priority", "score", "business_unit_id", "requestor_id", "pm_id", "budget", "startDate", "targetDate", CASE WHEN "created_at" = '(datetime(''now''))' THEN strftime('%Y-%m-%dT%H:%M:%SZ', 'now') ELSE "created_at" END FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE INDEX `projects_bu_idx` ON `projects` (`business_unit_id`);--> statement-breakpoint
CREATE TABLE `__new_support_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text,
	`title` text NOT NULL,
	`priority` text DEFAULT 'p3' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`reported_by` text,
	`assignee_id` text,
	`slaDueAt` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reported_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_support_tickets`("id", "project_id", "title", "priority", "status", "reported_by", "assignee_id", "slaDueAt", "created_at") SELECT "id", "project_id", "title", "priority", "status", "reported_by", "assignee_id", "slaDueAt", CASE WHEN "created_at" = '(datetime(''now''))' THEN strftime('%Y-%m-%dT%H:%M:%SZ', 'now') ELSE "created_at" END FROM `support_tickets`;--> statement-breakpoint
DROP TABLE `support_tickets`;--> statement-breakpoint
ALTER TABLE `__new_support_tickets` RENAME TO `support_tickets`;--> statement-breakpoint
CREATE INDEX `tickets_status_idx` ON `support_tickets` (`status`);--> statement-breakpoint
CREATE INDEX `tickets_project_idx` ON `support_tickets` (`project_id`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`avatar_url` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "name", "role", "avatar_url", "created_at") SELECT "id", "email", "name", "role", "avatar_url", CASE WHEN "created_at" = '(datetime(''now''))' THEN strftime('%Y-%m-%dT%H:%M:%SZ', 'now') ELSE "created_at" END FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);