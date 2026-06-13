const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

const DEFAULT_BANNERS = [
  { id: 1, title: 'Summer Sale!', subtitle: 'Up to 50% off on Kitchen items', emoji: '🍳', bg: 'from-orange-600 to-red-600', imageUrl: null, link: '/' },
  { id: 2, title: 'New Arrivals', subtitle: 'Fresh home decor collection', emoji: '🏠', bg: 'from-blue-600 to-purple-600', imageUrl: null, link: '/' },
  { id: 3, title: 'Flash Deal', subtitle: 'Limited time offers today', emoji: '⚡', bg: 'from-green-600 to-teal-600', imageUrl: null, link: '/' },
];

const DEFAULT_BADGES = [
  { emoji: '🚚', title: 'Fast Delivery', subtitle: 'Free shipping over ৳2000' },
  { emoji: '✅', title: 'Quality Products', subtitle: 'Verified & authenticated' },
  { emoji: '📞', title: 'Customer Support', subtitle: '9am to 9pm daily' },
  { emoji: '💳', title: 'Secure Payment', subtitle: 'bKash, Nagad & COD' },
];

const DEFAULT_SHIPPING = `Inside Dhaka: Delivery within 24-48 hours. Charge: ৳60
Outside Dhaka: Delivery within 3-5 days. Charge: ৳120
Free delivery on orders above ৳2,000`;

const DEFAULT_RETURN = `Returns accepted within 7 days of delivery
Product must be in original condition with packaging intact
Return shipping fees apply unless product is defective`;

// GET SETTINGS
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.siteSettings.findFirst();
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          banners: JSON.stringify(DEFAULT_BANNERS),
          trustBadges: JSON.stringify(DEFAULT_BADGES),
          shopName: 'ShopBD',
          heroTitle: 'Everything for Your Home',
          heroSubtitle: 'Kitchen, bedroom, bathroom & more.',
          shippingPolicy: DEFAULT_SHIPPING,
          returnPolicy: DEFAULT_RETURN,
        }
      });
    }
    res.json({
      ...settings,
      banners: JSON.parse(settings.banners),
      trustBadges: JSON.parse(settings.trustBadges),
      shippingPolicy: settings.shippingPolicy || DEFAULT_SHIPPING,
      returnPolicy: settings.returnPolicy || DEFAULT_RETURN,
      insideDhakaCharge: settings.insideDhakaCharge ?? 60,
      outsideDhakaCharge: settings.outsideDhakaCharge ?? 120,
      freeDeliveryAbove: settings.freeDeliveryAbove ?? 10000,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE SETTINGS (admin only)
router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { banners, trustBadges, shopName, heroTitle, heroSubtitle, shippingPolicy, returnPolicy, insideDhakaCharge, outsideDhakaCharge, freeDeliveryAbove } = req.body;
    let settings = await prisma.siteSettings.findFirst();
    if (settings) {
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: {
          banners: banners ? JSON.stringify(banners) : undefined,
          trustBadges: trustBadges ? JSON.stringify(trustBadges) : undefined,
          shopName: shopName || undefined,
          heroTitle: heroTitle || undefined,
          heroSubtitle: heroSubtitle || undefined,
          shippingPolicy: shippingPolicy !== undefined ? shippingPolicy : undefined,
          returnPolicy: returnPolicy !== undefined ? returnPolicy : undefined,
          insideDhakaCharge: insideDhakaCharge !== undefined ? parseFloat(insideDhakaCharge) : undefined,
          outsideDhakaCharge: outsideDhakaCharge !== undefined ? parseFloat(outsideDhakaCharge) : undefined,
          freeDeliveryAbove: freeDeliveryAbove !== undefined ? parseFloat(freeDeliveryAbove) : undefined,
        }
      });
    }
    res.json({
      message: 'Settings updated',
      ...settings,
      banners: JSON.parse(settings.banners),
      trustBadges: JSON.parse(settings.trustBadges),
      shippingPolicy: settings.shippingPolicy || DEFAULT_SHIPPING,
      returnPolicy: settings.returnPolicy || DEFAULT_RETURN,
      insideDhakaCharge: settings.insideDhakaCharge ?? 60,
      outsideDhakaCharge: settings.outsideDhakaCharge ?? 120,
      freeDeliveryAbove: settings.freeDeliveryAbove ?? 10000,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPLOAD BANNER IMAGE (admin only)
router.post('/banner-image', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;