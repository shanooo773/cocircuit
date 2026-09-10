-- Run this once against your MySQL database:
--   mysql -u root -p cocircuit < schema.sql
-- (create the database first: CREATE DATABASE cocircuit CHARACTER SET utf8mb4;)

CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS job_applications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(190) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    role_interest VARCHAR(120) NOT NULL,
    experience VARCHAR(40) NULL,
    linkedin_url VARCHAR(255) NULL,
    message TEXT NULL,
    cv_filename VARCHAR(255) NOT NULL,      -- randomly generated name on disk
    cv_original_name VARCHAR(255) NOT NULL, -- original filename, for display/download
    cv_size INT UNSIGNED NOT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
