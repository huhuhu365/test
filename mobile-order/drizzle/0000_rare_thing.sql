CREATE TABLE `dishes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price` integer NOT NULL,
	`category` text DEFAULT '主食' NOT NULL,
	`image_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`dish_id` integer,
	`dish_name` text NOT NULL,
	`unit_price` integer NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dish_id`) REFERENCES `dishes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_order_items_order_id` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`table_number` integer NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`total` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_orders_order_number` ON `orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `idx_orders_status_created` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_table_created` ON `orders` (`table_number`,`created_at`);
--> statement-breakpoint
INSERT INTO `dishes` (`name`, `description`, `price`, `category`, `sort_order`) VALUES ('招牌牛肉饭', '慢炖牛腩、溏心蛋、时蔬', 32, '热销', 1);
--> statement-breakpoint
INSERT INTO `dishes` (`name`, `description`, `price`, `category`, `sort_order`) VALUES ('照烧鸡腿饭', '去骨鸡腿、照烧汁、温泉蛋', 28, '热销', 2);
--> statement-breakpoint
INSERT INTO `dishes` (`name`, `description`, `price`, `category`, `sort_order`) VALUES ('鲜虾云吞面', '手工云吞、鲜虾、清鸡汤', 26, '主食', 3);
--> statement-breakpoint
INSERT INTO `dishes` (`name`, `description`, `price`, `category`, `sort_order`) VALUES ('黄金薯条', '粗切薯条，现点现炸', 12, '小吃', 4);
--> statement-breakpoint
INSERT INTO `dishes` (`name`, `description`, `price`, `category`, `sort_order`) VALUES ('手打柠檬茶', '香水柠檬、茉莉茶汤', 14, '饮品', 5);
--> statement-breakpoint
PRAGMA optimize;
