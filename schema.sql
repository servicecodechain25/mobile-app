-- Admin App Database Schema
-- Simplified database setup for admin management application

CREATE DATABASE IF NOT EXISTS `admin_app` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `admin_app`;

-- Users table with role-based access control
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(191) NOT NULL,
  `role` ENUM('superadmin', 'admin', 'staff') DEFAULT 'admin',
  `permissions` JSON NULL COMMENT 'Menu permissions for admin users',
  `created_by` INT UNSIGNED NULL COMMENT 'ID of user who created this user',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_created_by` (`created_by`),
  CONSTRAINT `fk_users_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Brands table for managing phone brands
CREATE TABLE IF NOT EXISTS `brands` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Brand name',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Whether brand is active',
  `created_by` INT UNSIGNED NULL COMMENT 'ID of user who created this brand',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_brand_name` (`name`),
  INDEX `idx_brands_active` (`is_active`),
  INDEX `idx_brands_created_by` (`created_by`),
  CONSTRAINT `fk_brands_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- IMEI records table for storing phone box information
CREATE TABLE IF NOT EXISTS `imei_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `imei` VARCHAR(191) NOT NULL UNIQUE COMMENT 'IMEI number',
  `purchase` VARCHAR(191) NULL COMMENT 'Purchase/Vendor name',
  `amount` DECIMAL(10, 2) NULL COMMENT 'Purchase Amount/Price',
  `date` DATE NULL COMMENT 'Purchase/Record date',
  `brand` VARCHAR(100) NULL COMMENT 'Phone brand',
  `model` VARCHAR(100) NULL COMMENT 'Phone model',
  `color` VARCHAR(50) NULL COMMENT 'Phone color',
  `ram` VARCHAR(50) NULL COMMENT 'RAM size',
  `storage` VARCHAR(50) NULL COMMENT 'Storage size',
  `created_by` INT UNSIGNED NULL COMMENT 'ID of user who created this record',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_imei` (`imei`),
  INDEX `idx_imei_created_by` (`created_by`),
  INDEX `idx_imei_created_at` (`created_at`),
  INDEX `idx_imei_brand` (`brand`),
  CONSTRAINT `fk_imei_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sold records table for tracking phone sales
CREATE TABLE IF NOT EXISTS `sold_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `imei_id` BIGINT UNSIGNED NOT NULL COMMENT 'Reference to imei_records',
  `sold_name` VARCHAR(191) NULL COMMENT 'Buyer/Sold to name',
  `sold_amount` DECIMAL(10, 2) NULL COMMENT 'Sale amount',
  `sold_date` DATE NULL COMMENT 'Sale date',
  `store` VARCHAR(191) NULL COMMENT 'Store name',
  `created_by` INT UNSIGNED NULL COMMENT 'ID of user who created this sale',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sold_imei_id` (`imei_id`),
  INDEX `idx_sold_created_by` (`created_by`),
  INDEX `idx_sold_date` (`sold_date`),
  INDEX `idx_sold_store` (`store`),
  CONSTRAINT `fk_sold_imei_id` FOREIGN KEY (`imei_id`) REFERENCES `imei_records`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sold_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity logs table for tracking user actions
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL COMMENT 'ID of user who performed the action',
  `user_name` VARCHAR(191) NULL COMMENT 'Name of user (for historical reference)',
  `action` VARCHAR(50) NOT NULL COMMENT 'Action type: create, update, delete, login, etc.',
  `entity_type` VARCHAR(50) NULL COMMENT 'Entity type: imei, sold, brand, staff, admin, etc.',
  `entity_id` BIGINT UNSIGNED NULL COMMENT 'ID of the entity affected',
  `description` TEXT NULL COMMENT 'Description of the action',
  `metadata` JSON NULL COMMENT 'Additional metadata (old values, new values, etc.)',
  `ip_address` VARCHAR(45) NULL COMMENT 'IP address of the user',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_logs_user_id` (`user_id`),
  INDEX `idx_logs_action` (`action`),
  INDEX `idx_logs_entity` (`entity_type`, `entity_id`),
  INDEX `idx_logs_created_at` (`created_at`),
  CONSTRAINT `fk_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example superadmin seed (password: superadmin123)
-- Uncomment and run to create the first superadmin user
-- INSERT INTO `users` (`name`, `email`, `password`, `role`, `created_at`) VALUES
-- ('Super Admin', 'superadmin@example.com', '$2a$10$Uo1Uq8eYVtY6l1I50L4O9uHaTn9S5nK5H8mD1pD0H0wT5n3iGQk2a', 'superadmin', NOW());

