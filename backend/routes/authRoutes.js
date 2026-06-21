const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const prisma = new PrismaClient();

// Rate Limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  skipSuccessfulRequests: true,
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: { error: 'Too many OTP requests. Please try again after 10 minutes.' },
});

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !password) return res.status(400).json({ error: 'Name and password are required' });
    if (!email && !phone) return res.status(400).json({ error: 'Email or phone number is required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ error: 'Email already registered' });
    }
    if (phone) {
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) return res.status(400).json({ error: 'Phone number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email || null, phone: phone || null, password: hashedPassword }
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) return res.status(400).json({ error: 'Email/Phone and password are required' });

    const isPhone = /^(\+8801|8801|01)[3-9]\d{8}$/.test(emailOrPhone);
    const user = isPhone
      ? await prisma.user.findUnique({ where: { phone: emailOrPhone } })
      : await prisma.user.findUnique({ where: { email: emailOrPhone } });

    if (!user) return res.status(401).json({ error: 'Invalid email/phone or password' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid email/phone or password' });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET PROFILE
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true }
    });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// UPDATE PROFILE
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { name, phone: phone || null },
      select: { id: true, name: true, email: true, phone: true, role: true }
    });
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── FORGOT PASSWORD ───────────────────────────────────────────

// SEND OTP — Email
router.post('/forgot-password/email', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'No account found with this email' });

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.oTP.deleteMany({ where: { target: email, type: 'email' } });
    await prisma.oTP.create({
      data: { target: email, code, type: 'email', expiresAt }
    });

    await transporter.sendMail({
      from: `"ShopBD" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'ShopBD Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f97316;">ShopBD Password Reset</h2>
          <p>Your OTP code is:</p>
          <div style="background: #f97316; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 12px; letter-spacing: 8px;">
            ${code}
          </div>
          <p style="color: #666; margin-top: 15px;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #666;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// SEND OTP — Phone (SMS placeholder)
router.post('/forgot-password/phone', otpLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(404).json({ error: 'No account found with this phone number' });

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.oTP.deleteMany({ where: { target: phone, type: 'phone' } });
    await prisma.oTP.create({
      data: { target: phone, code, type: 'phone', expiresAt }
    });

    // TODO: Replace with real SMS gateway (SSL Wireless / BD SMS)
    // await axios.post('https://sms.sslwireless.com/...', { ... });

    console.log(`📱 SMS OTP for ${phone}: ${code}`);
    res.json({
      message: 'OTP generated (SMS not configured yet)',
      debug_otp: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// VERIFY OTP + RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  try {
    const { target, code, newPassword } = req.body;
    if (!target || !code || !newPassword) {
      return res.status(400).json({ error: 'Target, OTP code and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const otp = await prisma.oTP.findFirst({
      where: {
        target,
        code,
        used: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!otp) return res.status(400).json({ error: 'Invalid or expired OTP' });

    await prisma.oTP.update({ where: { id: otp.id }, data: { used: true } });

    const isPhone = /^(\+8801|8801|01)[3-9]\d{8}$/.test(target);
    const user = isPhone
      ? await prisma.user.findUnique({ where: { phone: target } })
      : await prisma.user.findUnique({ where: { email: target } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password reset successfully! Please login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;