// server/src/app.js
const express = require('express');
const cors = require('cors');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();

app.set('trust proxy', 1);

const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  next();
})

// Rate Limiters
app.use('/api/programs', apiLimiter);
app.use('/api/universities', apiLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/password/forgot', authLimiter);

// Mount API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/filters', require('./routes/filters'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/universities', require('./routes/universities'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/2fa', require('./routes/twoFactor'));
app.use('/api/password', require('./routes/password'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'UniFinder API is running 🚀' });
});

module.exports = app;