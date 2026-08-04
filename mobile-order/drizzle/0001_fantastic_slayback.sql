ALTER TABLE `orders` ADD `payment_status` text DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `checkout_requested_at` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `paid_at` text;--> statement-breakpoint
CREATE INDEX `idx_orders_table_payment` ON `orders` (`table_number`,`payment_status`);