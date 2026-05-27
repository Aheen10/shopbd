const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

const DEFAULT_BANNERS = JSON.stringify([
  { bg: 'from-orange-600 to-red-600', title: 'Summer Sale!', subtitle: 'Up to 50% off on Kitchen items', emoji: '🍳', link: '/' },
  { bg: 'from-blue-600 to-purple-600', title: 'New Arrivals', subtitle: 'Fresh home decor collection', emoji: '🏠', link: '/' },
  { bg: 'from-green-600 to-teal-600', title: 'Flash Deal', subtitle: 'Limited time offers today', emoji: '⚡', link: '/' },
]);

const DEFAULT_BADGES = JSON.stringify([
  { emoji: '🚚', title: 'Fast Delivery', titleBn: 'দ্রুত ডেলিভারি', subtitle: 'Free shipping over ৳2000', subtitleBn: '৳২০০০ এর উপরে ফ্রি শিপিং' },
  { emoji: '✅', title: 'Quality Products', titleBn: 'মানসম্পন্ন পণ্য', subtitle: 'Verified & authenticated', subtitleBn: 'যাচাইকৃত ও প্রামাণিক' },
  { emoji: '📞', title: 'Customer Support', titleBn: 'কাস্টমার সাপোর্ট', subtitle: '9am to 9pm daily', subtitleBn: 'সকাল ৯টা থেকে রাত ৯টা' },
  { emoji: '💳', title: 'Secure Payment', titleBn: 'নিরাপদ পেমেন্ট', subtitle: 'bKash, Nagad & COD', subtitleBn: 'বিকাশ, নগদ ও ক্যাশ অন ডেলিভারি' },
]);

// GET settings
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.siteSettings.findFirst();
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          banners: DEFAULT_BANNERS,
          trustBadges: DEFAULT_BADGES,
        }
      });
    }
    res.json({
      ...settings,
      banners: JSON.parse(settings.banners),
      trustBadges: JSON.parse(settings.trustBadges),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE settings (admin only)
router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { banners, trustBadges, shopName, heroTitle, heroSubtitle } = req.body;
    let settings = await prisma.siteSettings.findFirst();

    const data = {
      banners: banners ? JSON.stringify(banners) : undefined,
      trustBadges: trustBadges ? JSON.stringify(trustBadges) : undefined,
      shopName, heroTitle, heroSubtitle,
    };

    // Remove undefined keys
    Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

    if (settings) {
      settings = await prisma.siteSettings.update({ where: { id: settings.id }, data });
    } else {
      settings = await prisma.siteSettings.create({ data: { banners: DEFAULT_BANNERS, trustBadges: DEFAULT_BADGES, ...data } });
    }

    res.json({
      ...settings,
      banners: JSON.parse(settings.banners),
      trustBadges: JSON.parse(settings.trustBadges),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload banner image (admin only)
router.post('/banner-image', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;