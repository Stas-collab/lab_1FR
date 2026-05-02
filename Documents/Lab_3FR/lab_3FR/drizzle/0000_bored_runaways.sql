CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`done` tinyint NOT NULL DEFAULT 0,
	`priority` varchar(10) NOT NULL DEFAULT 'low',
	`dueDate` varchar(20) DEFAULT '',
	`image` varchar(500),
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
