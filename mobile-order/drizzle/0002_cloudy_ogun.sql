CREATE TABLE `dish_images` (
	`key` text PRIMARY KEY NOT NULL,
	`content_type` text NOT NULL,
	`data_base64` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
