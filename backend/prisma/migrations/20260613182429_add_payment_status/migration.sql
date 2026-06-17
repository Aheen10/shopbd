-- AlterTable
ALTER TABLE `order` ADD COLUMN `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'cod_pending';

-- AlterTable
ALTER TABLE `product` MODIFY `emoji` VARCHAR(191) NOT NULL DEFAULT '📦';
