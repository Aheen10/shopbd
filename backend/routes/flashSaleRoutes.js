const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// GET active flash sale (public)
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const flashSale = await prisma.flashSale.findFirst({
      where: {
        isActive: true,
        startTime: { lte: now },
        endTime: { gte: now },
      },
      include: {
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(flashSale || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all flash sales (admin)
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const flashSales = await prisma.flashSale.findMany({
      include: {
        items: { include: { product: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(flashSales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE flash sale (admin)
router.post('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, startTime, endTime, items } = req.body;
    if (!title || !startTime || !endTime) return res.status(400).json({ error: 'Title, start and end time required' });
    if (new Date(endTime) <= new Date(startTime)) return res.status(400).json({ error: 'End time must be after start time' });

    const flashSale = await prisma.flashSale.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isActive: true,
        items: items?.length ? {
          create: items.map((item) => ({
            productId: parseInt(item.productId),
            discountType: item.discountType,
            discountValue: parseFloat(item.discountValue),
          }))
        } : undefined
      },
      include: { items: { include: { product: true } } }
    });
    res.status(201).json({ message: 'Flash sale created!', flashSale });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD item to flash sale (admin)
router.post('/admin/:id/items', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { productId, discountType, discountValue } = req.body;
    if (!productId || !discountType || !discountValue) return res.status(400).json({ error: 'All fields required' });

    const item = await prisma.flashSaleItem.create({
      data: {
        flashSaleId: parseInt(req.params.id),
        productId: parseInt(productId),
        discountType,
        discountValue: parseFloat(discountValue),
      },
      include: { product: true }
    });
    res.status(201).json({ message: 'Item added', item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REMOVE item from flash sale (admin)
router.delete('/admin/items/:itemId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.flashSaleItem.delete({ where: { id: parseInt(req.params.itemId) } });
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE flash sale status (admin)
router.put('/admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { isActive, title, startTime, endTime } = req.body;
    const flashSale = await prisma.flashSale.update({
      where: { id: parseInt(req.params.id) },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
        title: title || undefined,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
      }
    });
    res.json({ message: 'Flash sale updated', flashSale });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE flash sale (admin)
router.delete('/admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.flashSaleItem.deleteMany({ where: { flashSaleId: parseInt(req.params.id) } });
    await prisma.flashSale.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Flash sale deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;