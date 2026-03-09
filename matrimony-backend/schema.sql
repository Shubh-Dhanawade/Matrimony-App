-- ═══════════════════════════════════════════════════════════════════════════
-- MATRIMONY APP - COMPLETE DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════
-- Drop existing tables (if rebuilding)
-- DROP TABLE IF EXISTS `shortlists`;
-- DROP TABLE IF EXISTS `multiple_profile_images`;
-- DROP TABLE IF EXISTS `invitations`;
-- DROP TABLE IF EXISTS `profiles`;
-- DROP TABLE IF EXISTS `users`;
-- ═══════════════════════════════════════════════════════════════════════════
-- USERS TABLE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `users` (
    `id` int NOT NULL AUTO_INCREMENT,
    `mobile_number` varchar(15) NOT NULL UNIQUE,
    `password` varchar(255) NOT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `role` varchar(20) NOT NULL DEFAULT 'user',
    `is_blocked` tinyint(1) DEFAULT '0',
    `is_subscribed` tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY (`id`),
    UNIQUE KEY `mobile_number` (`mobile_number`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
-- ═══════════════════════════════════════════════════════════════════════════
-- PROFILES TABLE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `profiles` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL UNIQUE,
    `full_name` varchar(100) NOT NULL,
    `father_name` varchar(100) NULL,
    `mother_maiden_name` varchar(100) NULL,
    `dob` date NULL,
    `marital_status` enum('Single', 'Married', 'Divorced', 'Widowed') DEFAULT 'Single',
    `address` text NULL,
    `birthplace` varchar(100) NULL,
    `qualification` varchar(100) NULL,
    `occupation` varchar(100) NULL,
    `monthly_income` decimal(12, 2) NULL DEFAULT NULL,
    `caste` varchar(50) NULL,
    `sub_caste` varchar(50) NULL,
    `relative_surname` varchar(100) NULL,
    `expectations` text NULL,
    `avatar_url` text NULL,
    `other_comments` text NULL,
    `gender` enum('Male', 'Female', 'Other') NOT NULL,
    `profile_for` varchar(50) NOT NULL,
    `status` enum('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `state` varchar(100) NOT NULL,
    `district` varchar(100) NOT NULL,
    `taluka` varchar(100) NOT NULL,
    `is_verified` tinyint(1) DEFAULT '0',
    `last_active_at` timestamp NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `user_id` (`user_id`),
    KEY `status` (`status`),
    CONSTRAINT `profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
-- ═══════════════════════════════════════════════════════════════════════════
-- MULTIPLE PROFILE IMAGES TABLE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `multiple_profile_images` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL,
    `photo_url` varchar(255) NOT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_profile_images_user` (`user_id`),
    CONSTRAINT `fk_images_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
-- ═══════════════════════════════════════════════════════════════════════════
-- INVITATIONS TABLE (for sending interest/follow requests)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `invitations` (
    `id` int NOT NULL AUTO_INCREMENT,
    `sender_id` int NOT NULL,
    `receiver_id` int NOT NULL,
    `status` enum('Pending', 'Accepted', 'Rejected') DEFAULT 'Pending',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_invitation` (`sender_id`, `receiver_id`),
    KEY `sender_id` (`sender_id`),
    KEY `receiver_id` (`receiver_id`),
    KEY `status` (`status`),
    CONSTRAINT `invitations_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `invitations_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
-- ═══════════════════════════════════════════════════════════════════════════
-- SHORTLISTS TABLE (for saving profiles to favorites)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `shortlists` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL,
    `profile_user_id` int NOT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_shortlist` (`user_id`, `profile_user_id`),
    KEY `fk_shortlist_user` (`user_id`),
    KEY `fk_shortlist_profile_user` (`profile_user_id`),
    CONSTRAINT `fk_shortlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_shortlist_profile_user` FOREIGN KEY (`profile_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCKS TABLE (optional - for blocking users)
-- ═══════════════════════════════════════════════════════════════════════════
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
-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION: Check all tables
-- ═══════════════════════════════════════════════════════════════════════════
-- Run these queries to verify:
-- SHOW TABLES;
-- DESCRIBE users;
-- DESCRIBE profiles;
-- DESCRIBE multiple_profile_images;
-- DESCRIBE invitations;
-- DESCRIBE shortlists;
-- DESCRIBE blocks;
-- ═══════════════════════════════════════════════════════════════════════════
-- SAMPLE DATA (optional - for testing)
-- ═══════════════════════════════════════════════════════════════════════════
-- INSERT INTO users (mobile_number, password, role, is_subscribed) 
-- VALUES 
--   ('9876543210', 'hashed_password_1', 'user', 1),
--   ('9876543211', 'hashed_password_2', 'user', 0),
--   ('9876543212', 'hashed_password_3', 'user', 1);
-- ═══════════════════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════