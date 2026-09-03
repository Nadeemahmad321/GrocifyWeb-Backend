-- AlterTable
ALTER TABLE `otp_verifications` ADD COLUMN `purpose` VARCHAR(191) NOT NULL DEFAULT 'login';
