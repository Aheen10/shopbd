const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// BKASH PAYMENT SIMULATION
router.post('/bkash', authMiddleware, async (req, res) => {
  try {
    const { orderId, phone, amount } = req.body;

    if (!phone || !amount || !orderId) {
      return res.status(400).json({ error: 'Phone, amount and orderId required' });
    }

    // Validate Bangladesh phone number
    const phoneRegex = /^(\+8801|8801|01)[3-9]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid Bangladesh phone number' });
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 90% success rate simulation
    const isSuccess = Math.random() > 0.1;

    if (!isSuccess) {
      return res.status(400).json({ error: 'Payment failed. Please try again.' });
    }

    const transactionId = `BK${Date.now()}${Math.floor(Math.random() * 10000)}`;

    // Update order status
    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: 'paid' }
    });

    res.json({
      message: 'Payment successful',
      transactionId,
      method: 'bKash',
      amount,
      phone,
      orderId
    });

  } catch (err) {
    res.status(500).json({ error: 'Payment server error' });
  }
});

// NAGAD PAYMENT SIMULATION
router.post('/nagad', authMiddleware, async (req, res) => {
  try {
    const { orderId, phone, amount } = req.body;

    if (!phone || !amount || !orderId) {
      return res.status(400).json({ error: 'Phone, amount and orderId required' });
    }

    const phoneRegex = /^(\+8801|8801|01)[3-9]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid Bangladesh phone number' });
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    const isSuccess = Math.random() > 0.1;

    if (!isSuccess) {
      return res.status(400).json({ error: 'Payment failed. Please try again.' });
    }

    const transactionId = `NG${Date.now()}${Math.floor(Math.random() * 10000)}`;

    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: 'paid' }
    });

    res.json({
      message: 'Payment successful',
      transactionId,
      method: 'Nagad',
      amount,
      phone,
      orderId
    });

  } catch (err) {
    res.status(500).json({ error: 'Payment server error' });
  }
});

// CASH ON DELIVERY
router.post('/cod', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) return res.status(400).json({ error: 'OrderId required' });

    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: 'cod_pending' }
    });

    res.json({
      message: 'Cash on delivery confirmed',
      method: 'Cash on Delivery',
      orderId
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET PAYMENT STATUS
router.get('/status/:orderId', authMiddleware, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.orderId) }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ orderId: order.id, status: order.status });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;