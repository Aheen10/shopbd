-- AlterTable
ALTER TABLE `product` MODIFY `emoji` VARCHAR(191) NOT NULL DEFAULT '📦';

-- AlterTable
ALTER TABLE `sitesettings` ADD COLUMN `freeDeliveryAbove` DOUBLE NOT NULL DEFAULT 10000,
    ADD COLUMN `insideDhakaCharge` DOUBLE NOT NULL DEFAULT 60,
    ADD COLUMN `outsideDhakaCharge` DOUBLE NOT NULL DEFAULT 120;
