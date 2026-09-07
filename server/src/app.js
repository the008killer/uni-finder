const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api/filters', require('./routes/filters'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/universities', require('./routes/universities'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'UniFinder API is running 🚀' });
});

module.exports = app;