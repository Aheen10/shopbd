-- AlterTable
ALTER TABLE `order` ADD COLUMN `deliveryAddress` TEXT NULL,
    ADD COLUMN `deliveryPhone` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `product` MODIFY `emoji` VARCHAR(191) NOT NULL DEFAULT '📦';
