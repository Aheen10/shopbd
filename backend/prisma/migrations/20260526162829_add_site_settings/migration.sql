-- AlterTable
ALTER TABLE `product` MODIFY `emoji` VARCHAR(191) NOT NULL DEFAULT '📦';

-- CreateTable
CREATE TABLE `SiteSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `banners` TEXT NOT NULL,
    `trustBadges` TEXT NOT NULL,
    `shopName` VARCHAR(191) NOT NULL DEFAULT 'ShopBD',
    `heroTitle` VARCHAR(191) NOT NULL DEFAULT 'Everything for Your Home',
    `heroSubtitle` VARCHAR(191) NOT NULL DEFAULT 'Kitchen, bedroom, bathroom & more.',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
