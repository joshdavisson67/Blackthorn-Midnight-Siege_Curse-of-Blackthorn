CREATE TABLE `dead_tide_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`mode` text DEFAULT 'dead-tide' NOT NULL,
	`name` text NOT NULL,
	`kills` integer NOT NULL,
	`threat_level` integer NOT NULL,
	`threat_rank` text NOT NULL,
	`duration` integer NOT NULL,
	`score` integer NOT NULL,
	`headshots` integer DEFAULT 0 NOT NULL,
	`version` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `dead_tide_ranking_idx` ON `dead_tide_scores` (`kills`,`threat_level`,`duration`,`created_at`);