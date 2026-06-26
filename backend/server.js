const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join', (data) => {
    socket.rooms.forEach(room => {
      if (room !== socket.id) socket.leave(room);
    });
    if (data.role === 'admin') {
      socket.join('admin');
      console.log(`👑 Admin joined room [admin] - socket: ${socket.id}`);
    }
    if (data.userId) {
      socket.join(`user_${data.userId}`);
      console.log(`👤 User ${data.userId} joined room [user_${data.userId}]`);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
  });
});

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// XSS Sanitization
app.use((req, res, next) => {
  if (req.body) {
    const sanitize = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// General Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.get('/', (req, res) => {
  res.json({ message: '🚀 ShopBD API is running!', status: 'OK' });
});

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);
const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);
const cartRoutes = require('./routes/cartRoutes');
app.use('/api/cart', cartRoutes);
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payment', paymentRoutes);
const settingsRoutes = require('./routes/settingsRoutes');
app.use('/api/settings', settingsRoutes);
const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);
const wishlistRoutes = require('./routes/wishlistRoutes');
app.use('/api/wishlist', wishlistRoutes);
const returnRoutes = require('./routes/returnRoutes');
app.use('/api/returns', returnRoutes);
const couponRoutes = require('./routes/couponRoutes');
app.use('/api/coupons', couponRoutes);
const flashSaleRoutes = require('./routes/flashSaleRoutes');
app.use('/api/flash-sale', flashSaleRoutes);

const { errorHandler, notFound } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});