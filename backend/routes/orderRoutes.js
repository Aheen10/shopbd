const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { sendOrderConfirmation } = require('../middleware/emailService');

const router = express.Router();
const prisma = new PrismaClient();

// PLACE ORDER
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'No items provided' });

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return res.status(404).json({ error: `Product ${item.productId} not found` });
      if (product.stock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });

      total += product.price * item.quantity;
      orderItems.push({ productId: item.productId, quantity: item.quantity, price: product.price });
    }

    const order = await prisma.order.create({
      data: {
        userId: req.user.userId,
        total,
        orderItems: { create: orderItems }
      },
      include: { orderItems: { include: { product: true } } }
    });

    // Update stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    // Send confirmation email
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      await sendOrderConfirmation(user.email, {
        orderId: order.id,
        customerName: user.name,
        items: order.orderItems.map(i => ({
          name: i.product.name,
          emoji: i.product.emoji,
          quantity: i.quantity,
          price: i.price
        })),
        total: order.total
      });
    } catch (emailErr) {
      console.log('Email error:', emailErr.message);
    }

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET MY ORDERS
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId },
      include: { orderItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET ALL ORDERS (admin only)
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { user: { select: { name: true, email: true } }, orderItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE ORDER STATUS (admin only)
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });
    res.json({ message: 'Order status updated', order });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;