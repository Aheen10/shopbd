const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { sendOrderConfirmation } = require('../middleware/emailService');

const router = express.Router();
const prisma = new PrismaClient();

const generateOrderId = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.order.count();
  return `SBD-${year}-${String(count + 1).padStart(4, '0')}`;
};

// PLACE ORDER
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, phone, address } = req.body;
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

    // Calculate delivery charge
    const settings = await prisma.siteSettings.findFirst();
    const insideCharge = settings?.insideDhakaCharge ?? 60;
    const outsideCharge = settings?.outsideDhakaCharge ?? 120;
    const freeAbove = settings?.freeDeliveryAbove ?? 2000;

    let deliveryCharge = 0;
    if (total < freeAbove) {
      deliveryCharge = address?.district === 'Dhaka' ? insideCharge : outsideCharge;
    }
    total += deliveryCharge;

    const uniqueId = await generateOrderId();

    if (phone) {
      const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (!currentUser.phone) {
        await prisma.user.update({ where: { id: req.user.userId }, data: { phone } });
      }
    }

    const order = await prisma.order.create({
      data: {
        userId: req.user.userId,
        total,
        uniqueId,
        status: 'pending',
        paymentStatus: 'cod_pending',
        deliveryPhone: phone || null,
        deliveryAddress: address ? JSON.stringify(address) : null,
        orderItems: { create: orderItems }
      },
      include: { orderItems: { include: { product: true } }, user: true }
    });

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    // 🔔 Notify admin
    const io = req.app.get('io');
    console.log('📢 IO instance:', !!io);
    if (io) {
      const adminRoom = io.sockets.adapter.rooms.get('admin');
      console.log('👑 Admin room members:', adminRoom ? adminRoom.size : 0);
      io.to('admin').emit('new_order', {
        id: order.id,
        uniqueId: order.uniqueId,
        customerName: order.user?.name,
        customerPhone: phone || order.user?.phone,
        total: order.total,
        itemCount: orderItems.length,
        createdAt: order.createdAt,
        message: `New order from ${order.user?.name}!`,
      });
      console.log('✅ new_order emitted to admin room');
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (user.email) {
        await sendOrderConfirmation(user.email, {
          orderId: order.uniqueId || order.id,
          customerName: user.name,
          items: order.orderItems.map(i => ({
            name: i.product.name,
            emoji: i.product.emoji,
            quantity: i.quantity,
            price: i.price
          })),
          total: order.total
        });
      }
    } catch (emailErr) {
      console.log('Email error:', emailErr.message);
    }

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

// GET ALL ORDERS (admin)
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        orderItems: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const parsedOrders = orders.map((o) => {
      const deliveryAddress = o.deliveryAddress ? JSON.parse(o.deliveryAddress) : null;
      return {
        ...o,
        deliveryAddress,
        user: { ...o.user, phone: o.user.phone || o.deliveryPhone || null }
      };
    });

    res.json(parsedOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE ORDER STATUS (admin)
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
      include: { user: true }
    });

    // 🔔 Notify customer
    const io = req.app.get('io');
    console.log('📢 Notifying user:', order.userId);
    if (io && order.userId) {
      const userRoom = io.sockets.adapter.rooms.get(`user_${order.userId}`);
      console.log(`👤 User_${order.userId} room members:`, userRoom ? userRoom.size : 0);

      const statusMessages = {
        processing: '⚙️ Your order is being processed!',
        shipped: '🚚 Your order has been shipped!',
        delivered: '📦 Your order has been delivered!',
        paid: '✅ Your payment has been confirmed!',
        cod_pending: '💵 COD order confirmed!',
      };
      const message = statusMessages[status] || `Order status updated to ${status}`;

      io.to(`user_${order.userId}`).emit('order_update', {
        orderId: order.id,
        uniqueId: order.uniqueId,
        status,
        message,
      });
      console.log('✅ order_update emitted to user_' + order.userId);
    }

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;