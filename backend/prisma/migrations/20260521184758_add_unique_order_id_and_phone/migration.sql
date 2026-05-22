/*
  Warnings:

  - A unique constraint covering the columns `[uniqueId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `order` ADD COLUMN `uniqueId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `product` MODIFY `emoji` VARCHAR(191) NOT NULL DEFAULT '📦';

-- AlterTable
ALTER TABLE `user` ADD COLUMN `phone` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Order_uniqueId_key` ON `Order`(`uniqueId`);
