const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api/filters', require('./routes/filters'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/universities', require('./routes/universities'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/2fa', require('./routes/twoFactor'));
app.use('/api/password', require('./routes/password'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'UniFinder API is running ' });
});

module.exports = app;