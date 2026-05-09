ALTER TABLE `tasks` MODIFY COLUMN `done` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `done` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `priority` enum('low','medium','high') NOT NULL DEFAULT 'low';