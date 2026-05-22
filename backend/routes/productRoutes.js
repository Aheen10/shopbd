const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Validation Schema
const productSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().optional().allow(''),
  price: Joi.number().positive().required(),
  oldPrice: Joi.number().positive().optional().allow('', null),
  category: Joi.string().required(),
  emoji: Joi.string().optional().allow(''),
  stock: Joi.number().integer().min(0).required(),
  specifications: Joi.string().optional().allow('', null),
});

// GET ALL PRODUCTS (with search & filter)
router.get('/', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    const where = {};
    if (search) where.name = { contains: search };
    if (category) where.category = category;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET SINGLE PRODUCT
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: { category: true }
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE PRODUCT (admin only) - supports multiple images
router.post('/', authMiddleware, adminMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      description: req.body.description || null,
      price: parseFloat(req.body.price),
      oldPrice: req.body.oldPrice ? parseFloat(req.body.oldPrice) : null,
      category: req.body.category,
      emoji: req.body.emoji || '📦',
      stock: parseInt(req.body.stock),
      specifications: req.body.specifications || null,
    };

    // First image as main imageUrl
    if (req.files && req.files.length > 0) {
      data.imageUrl = `/uploads/${req.files[0].filename}`;
      // Store all image URLs as JSON in a field
      data.images = JSON.stringify(req.files.map(f => `/uploads/${f.filename}`));
    }

    const product = await prisma.product.create({ data });
    res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE PRODUCT (admin only) - supports multiple images
router.put('/:id', authMiddleware, adminMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const updateData = {};

    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description || null;
    if (req.body.price) updateData.price = parseFloat(req.body.price);
    if (req.body.oldPrice !== undefined) updateData.oldPrice = req.body.oldPrice ? parseFloat(req.body.oldPrice) : null;
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.emoji) updateData.emoji = req.body.emoji;
    if (req.body.stock !== undefined) updateData.stock = parseInt(req.body.stock);
    if (req.body.specifications !== undefined) updateData.specifications = req.body.specifications || null;

    // Update images if new ones uploaded
    if (req.files && req.files.length > 0) {
      updateData.imageUrl = `/uploads/${req.files[0].filename}`;
      updateData.images = JSON.stringify(req.files.map(f => `/uploads/${f.filename}`));
    }

    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
    });
    res.json({ message: 'Product updated', product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE PRODUCT (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;