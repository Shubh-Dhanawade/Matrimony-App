# Matrimony App SQL Setup

-- Create Database
CREATE DATABASE IF NOT EXISTS matrimony_db;
USE matrimony_db;

-- Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mobile_number VARCHAR(15) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profiles Table
CREATE TABLE profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  father_name VARCHAR(100),
  mother_maiden_name VARCHAR(100),
  dob DATE,
  gender ENUM('Male', 'Female', 'Other'),
  marital_status ENUM('Never Married', 'Married', 'Awaiting Divorce', 'Divorced', 'Widowed'),
  address TEXT,
  birthplace VARCHAR(100),
  qualification VARCHAR(100),
  occupation VARCHAR(100),
  monthly_income DECIMAL(12, 2),
  caste VARCHAR(50),
  sub_caste VARCHAR(50),
  relative_surname VARCHAR(100),
  expectations TEXT,
  avatar_url TEXT,
  other_comments TEXT,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Invitations Table
CREATE TABLE invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  status ENUM('Pending', 'Accepted', 'Rejected') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);
