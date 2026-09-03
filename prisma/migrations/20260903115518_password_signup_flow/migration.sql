-- AlterTable
ALTER TABLE `otp_verifications` ADD COLUMN `pendingMobile` VARCHAR(191) NULL,
    ADD COLUMN `pendingName` VARCHAR(191) NULL,
    ADD COLUMN `pendingPasswordHash` VARCHAR(191) NULL,
    MODIFY `purpose` VARCHAR(191) NOT NULL DEFAULT 'signup';
