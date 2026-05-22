-- AlterTable
ALTER TABLE `product` ADD COLUMN `images` TEXT NULL,
    MODIFY `emoji` VARCHAR(191) NOT NULL DEFAULT '📦';
