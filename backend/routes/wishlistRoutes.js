const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// GET user's wishlist
router.get('/', authMiddleware, async (req, res) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user.userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD to wishlist
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: req.user.userId, productId: parseInt(productId) } }
    });
    if (existing) return res.status(400).json({ error: 'Already in wishlist' });

    const item = await prisma.wishlist.create({
      data: { userId: req.user.userId, productId: parseInt(productId) },
      include: { product: true }
    });
    res.status(201).json({ message: 'Added to wishlist', item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REMOVE from wishlist
router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    await prisma.wishlist.delete({
      where: { userId_productId: { userId: req.user.userId, productId: parseInt(req.params.productId) } }
    });
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;