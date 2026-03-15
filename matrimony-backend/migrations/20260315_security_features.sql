-- Migration to add security features to the database

-- 1. Add login activity and token version to users table
ALTER TABLE `users` 
ADD COLUMN `last_login_at` TIMESTAMP NULL,
ADD COLUMN `last_login_device` VARCHAR(255) NULL,
ADD COLUMN `last_login_location` VARCHAR(255) NULL,
ADD COLUMN `token_version` INT DEFAULT 0;

-- 2. Add privacy settings to profiles table
ALTER TABLE `profiles`
ADD COLUMN `privacy_setting` ENUM('Public', 'Only Connected Users', 'Paid Members Only') DEFAULT 'Public';

-- 3. Ensure blocks table exists (it was optional in schema.sql but now required)
CREATE TABLE IF NOT EXISTS `blocks` (
    `id` int NOT NULL AUTO_INCREMENT,
    `blocker_id` int NOT NULL,
    `blocked_user_id` int NOT NULL,
    `reason` text NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_block` (`blocker_id`, `blocked_user_id`),
    KEY `blocker_id` (`blocker_id`),
    KEY `blocked_user_id` (`blocked_user_id`),
    CONSTRAINT `blocks_ibfk_1` FOREIGN KEY (`blocker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `blocks_ibfk_2` FOREIGN KEY (`blocked_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
