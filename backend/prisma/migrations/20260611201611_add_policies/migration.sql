-- AlterTable
ALTER TABLE `product` MODIFY `emoji` VARCHAR(191) NOT NULL DEFAULT '📦';

-- AlterTable
ALTER TABLE `sitesettings` ADD COLUMN `returnPolicy` TEXT NULL,
    ADD COLUMN `shippingPolicy` TEXT NULL;
