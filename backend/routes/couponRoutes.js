const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// VALIDATE COUPON (user)
router.post('/validate', authMiddleware, async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code required' });

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

    if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
    if (!coupon.isActive) return res.status(400).json({ error: 'This coupon is no longer active' });
    if (coupon.expiresAt && new Date() > coupon.expiresAt) return res.status(400).json({ error: 'This coupon has expired' });
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return res.status(400).json({ error: 'This coupon has reached its usage limit' });
    if (orderTotal < coupon.minOrderAmount) return res.status(400).json({ error: `Minimum order amount is ৳${coupon.minOrderAmount} for this coupon` });

    // Check if user already used this coupon
    const alreadyUsed = await prisma.couponUse.findFirst({
      where: { couponId: coupon.id, userId: req.user.userId }
    });
    if (alreadyUsed) return res.status(400).json({ error: 'You have already used this coupon' });

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (orderTotal * coupon.value) / 100;
    } else {
      discount = coupon.value;
    }
    discount = Math.min(discount, orderTotal); // can't exceed order total

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: Math.round(discount),
      },
      message: `✅ Coupon applied! You save ৳${Math.round(discount)}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL COUPONS (admin)
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      include: { _count: { select: { uses: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE COUPON (admin)
router.post('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { code, type, value, minOrderAmount, maxUses, expiresAt, isActive } = req.body;
    if (!code || !type || !value) return res.status(400).json({ error: 'Code, type and value are required' });
    if (!['percentage', 'fixed'].includes(type)) return res.status(400).json({ error: 'Type must be percentage or fixed' });
    if (type === 'percentage' && value > 100) return res.status(400).json({ error: 'Percentage cannot exceed 100' });

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== false,
      }
    });
    res.status(201).json({ message: 'Coupon created!', coupon });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Coupon code already exists' });
    res.status(500).json({ error: err.message });
  }
});

// UPDATE COUPON (admin)
router.put('/admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { isActive, expiresAt, maxUses } = req.body;
    const coupon = await prisma.coupon.update({
      where: { id: parseInt(req.params.id) },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        maxUses: maxUses !== undefined ? (maxUses ? parseInt(maxUses) : null) : undefined,
      }
    });
    res.json({ message: 'Coupon updated', coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE COUPON (admin)
router.delete('/admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.couponUse.deleteMany({ where: { couponId: parseInt(req.params.id) } });
    await prisma.coupon.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;