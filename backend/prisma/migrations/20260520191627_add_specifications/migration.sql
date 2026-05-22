-- AlterTable
ALTER TABLE `product` ADD COLUMN `specifications` TEXT NULL,
    MODIFY `emoji` VARCHAR(191) NOT NULL DEFAULT '📦';
