ALTER TABLE `orders` ADD `request_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_orders_request_id` ON `orders` (`request_id`);