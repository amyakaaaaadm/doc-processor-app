CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalFileName` varchar(255) NOT NULL,
	`originalFileKey` varchar(255) NOT NULL,
	`originalFileUrl` text NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`fileSize` int NOT NULL,
	`isScan` int NOT NULL DEFAULT 0,
	`extractedText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processingHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`outputFormat` varchar(50) NOT NULL,
	`processedFileKey` varchar(255) NOT NULL,
	`processedFileUrl` text NOT NULL,
	`processedText` text,
	`translateFrom` varchar(50) DEFAULT 'none',
	`translateTo` varchar(50) DEFAULT 'none',
	`ocrLanguages` varchar(255) DEFAULT 'eng,rus,uzb',
	`preserveStructure` int DEFAULT 1,
	`status` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `processingHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `processingHistory` ADD CONSTRAINT `processingHistory_documentId_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `processingHistory` ADD CONSTRAINT `processingHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;