CREATE TABLE `aiControls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`autoSwitchEnabled` int NOT NULL DEFAULT 0,
	`maxMonthlySavingsCents` int NOT NULL DEFAULT 0,
	`maxPriceIncreaseCents` int NOT NULL DEFAULT 0,
	`notifyPush` int NOT NULL DEFAULT 1,
	`notifyEmail` int NOT NULL DEFAULT 1,
	`notifySms` int NOT NULL DEFAULT 1,
	`scheduleCronTaskUid` varchar(65),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiControls_id` PRIMARY KEY(`id`),
	CONSTRAINT `aiControls_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agent` enum('yuna','bill_advisor','commute','system') NOT NULL,
	`action` varchar(120) NOT NULL,
	`decision` varchar(48) NOT NULL,
	`reasoning` text NOT NULL,
	`dataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `billPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`billId` int NOT NULL,
	`provider` varchar(120) NOT NULL,
	`planName` varchar(120) NOT NULL,
	`monthlyCents` int NOT NULL,
	`savingsCents` int NOT NULL,
	`usageFit` int NOT NULL,
	`contractLabel` varchar(80) NOT NULL,
	CONSTRAINT `billPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('utility','phone','insurance') NOT NULL,
	`provider` varchar(120) NOT NULL,
	`amountCents` int NOT NULL,
	`dueDate` varchar(32) NOT NULL,
	`usageMetric` varchar(120) NOT NULL,
	`currentPlan` varchar(120) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(120) NOT NULL,
	`handle` varchar(80) NOT NULL,
	`phone` varchar(32),
	`relationship` varchar(48),
	`color` varchar(16) NOT NULL DEFAULT '#8de0c1',
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escalations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`billId` int NOT NULL,
	`prompt` text NOT NULL,
	`status` enum('pending','approved','declined','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `escalations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`channel` enum('push','email','in_app','sms') NOT NULL,
	`title` varchar(160) NOT NULL,
	`body` text NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'delivered',
	`relatedType` varchar(48),
	`relatedId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phone` varchar(32) NOT NULL,
	`handle` varchar(80) NOT NULL,
	`dob` varchar(32),
	`kycStatus` varchar(32) NOT NULL DEFAULT 'simulated',
	`linkedBank` varchar(120) NOT NULL DEFAULT 'Demo Community Bank',
	`balanceCents` int NOT NULL DEFAULT 284000,
	`pinConfigured` int NOT NULL DEFAULT 1,
	`biometricEnabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `profiles_handle_unique` UNIQUE(`handle`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`counterpartyName` varchar(120) NOT NULL,
	`counterpartyHandle` varchar(80),
	`type` enum('p2p','merchant','transit') NOT NULL,
	`direction` enum('in','out') NOT NULL,
	`amountCents` int NOT NULL,
	`feeCents` int NOT NULL DEFAULT 0,
	`note` text,
	`status` varchar(32) NOT NULL DEFAULT 'settled',
	`authMethod` varchar(32) NOT NULL,
	`authEvent` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
