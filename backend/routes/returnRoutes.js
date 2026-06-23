const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// CREATE RETURN REQUEST (user)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    if (!orderId || !reason) return res.status(400).json({ error: 'Order ID and reason are required' });

    // Check order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { returnRequests: true }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId !== req.user.userId) return res.status(403).json({ error: 'Not authorized' });
    if (order.status !== 'delivered') return res.status(400).json({ error: 'Only delivered orders can be returned' });

    // Check if already requested
    if (order.returnRequests.length > 0) {
      return res.status(400).json({ error: 'Return request already submitted for this order' });
    }

    // Check 7 days limit
    const deliveredDate = new Date(order.updatedAt);
    const daysDiff = Math.floor((new Date() - deliveredDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 7) return res.status(400).json({ error: 'Return period expired (7 days from delivery)' });

    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId: parseInt(orderId),
        userId: req.user.userId,
        reason,
        status: 'pending'
      },
      include: { order: true }
    });

    res.status(201).json({ message: 'Return request submitted!', returnRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET MY RETURN REQUESTS (user)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const returns = await prisma.returnRequest.findMany({
      where: { userId: req.user.userId },
      include: {
        order: {
          include: { orderItems: { include: { product: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL RETURN REQUESTS (admin)
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const returns = await prisma.returnRequest.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        order: {
          include: { orderItems: { include: { product: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE RETURN STATUS (admin)
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const returnRequest = await prisma.returnRequest.update({
      where: { id: parseInt(req.params.id) },
      data: { status, adminNote: adminNote || null },
      include: { user: true, order: true }
    });

    // Notify user via socket
    const io = req.app.get('io');
    if (io) {
      const statusMessages = {
        approved: '✅ Your return request has been approved!',
        rejected: '❌ Your return request has been rejected.',
        pending: '⏳ Your return request is under review.',
      };
      io.to(`user_${returnRequest.userId}`).emit('order_update', {
        orderId: returnRequest.orderId,
        uniqueId: returnRequest.order.uniqueId,
        status: `return_${status}`,
        message: statusMessages[status],
      });
    }

    res.json({ message: 'Return request updated', returnRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;