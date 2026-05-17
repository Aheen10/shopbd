const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// In-memory cart (Session based)
const carts = {};

// GET CART
router.get('/', authMiddleware, (req, res) => {
  const cart = carts[req.user.userId] || [];
  res.json(cart);
});

// ADD TO CART
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    if (!carts[req.user.userId]) carts[req.user.userId] = [];
    const cart = carts[req.user.userId];
    const existing = cart.find(i => i.productId === productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId, name: product.name, price: product.price, emoji: product.emoji, quantity });
    }

    res.json({ message: 'Added to cart', cart });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// REMOVE FROM CART
router.delete('/remove/:productId', authMiddleware, (req, res) => {
  const cart = carts[req.user.userId] || [];
  carts[req.user.userId] = cart.filter(i => i.productId !== parseInt(req.params.productId));
  res.json({ message: 'Removed from cart', cart: carts[req.user.userId] });
});

// CLEAR CART
router.delete('/clear', authMiddleware, (req, res) => {
  carts[req.user.userId] = [];
  res.json({ message: 'Cart cleared' });
});

module.exports = router;