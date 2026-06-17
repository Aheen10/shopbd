const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// GET reviews for a product
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: parseInt(req.params.productId) },
      include: { user: { select: { name: true, id: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({ reviews, avgRating: Math.round(avgRating * 10) / 10, totalReviews: reviews.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a review (must be logged in)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating) return res.status(400).json({ error: 'Product and rating required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

    // Check if user already reviewed
    const existing = await prisma.review.findFirst({
      where: { productId: parseInt(productId), userId: req.user.userId }
    });
    if (existing) return res.status(400).json({ error: 'You already reviewed this product' });

    // Check if user purchased this product
    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId: parseInt(productId),
        order: { userId: req.user.userId, status: { in: ['delivered', 'paid'] } }
      }
    });
    if (!purchased) return res.status(400).json({ error: 'You can only review products you have purchased' });

    const review = await prisma.review.create({
      data: {
        productId: parseInt(productId),
        userId: req.user.userId,
        rating: parseInt(rating),
        comment: comment || null
      },
      include: { user: { select: { name: true, id: true } } }
    });

    res.status(201).json({ message: 'Review added!', review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a review (own review only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.userId !== req.user.userId) return res.status(403).json({ error: 'Not authorized' });

    await prisma.review.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;