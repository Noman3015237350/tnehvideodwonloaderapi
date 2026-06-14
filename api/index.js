const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Store API keys (in production, use a database)
const apiKeys = new Map();

// Generate API key
function generateApiKey() {
  return 'TNEH-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    endpoints: {
      createkey: '/api/createkey',
      tiktok: '/api/TikTok?key={KEY}&url={URL}',
      facebook: '/api/Facebook?key={KEY}&url={URL}',
      instagram: '/api/Instagram?key={KEY}&url={URL}',
      youtube: '/api/YouTube?key={KEY}&url={URL}'
    }
  });
});

// Create API key
app.post('/api/createkey', (req, res) => {
  const apiKey = generateApiKey();
  apiKeys.set(apiKey, {
    createdAt: new Date(),
    requests: 0,
    dailyLimit: 1000
  });
  
  res.json({
    success: true,
    api_key: apiKey,
    message: 'Save this key securely! You can use it for all endpoints.',
    daily_limit: 1000,
    expires: 'Never (Manual removal only)'
  });
});

// Validate API key middleware
function validateApiKey(req, res, next) {
  const key = req.query.key;
  
  if (!key) {
    return res.status(401).json({ error: 'API key is required. Get one from /api/createkey' });
  }
  
  if (!apiKeys.has(key)) {
    return res.status(403).json({ error: 'Invalid API key. Get a valid key from /api/createkey' });
  }
  
  const keyData = apiKeys.get(key);
  keyData.requests++;
  apiKeys.set(key, keyData);
  
  next();
}

// TikTok Downloader
app.get('/api/TikTok', validateApiKey, async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    const response = await axios.get(`https://social-dl.lmnx9.workers.dev?url=${encodeURIComponent(url)}`);
    res.json({
      success: true,
      platform: 'TikTok',
      data: response.data,
      download_url: response.data.video || response.data.url
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download TikTok video', details: error.message });
  }
});

// Facebook Downloader
app.get('/api/Facebook', validateApiKey, async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    const response = await axios.get(`https://social-dl.lmnx9.workers.dev?url=${encodeURIComponent(url)}`);
    res.json({
      success: true,
      platform: 'Facebook',
      data: response.data,
      download_url: response.data.video || response.data.url
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download Facebook video', details: error.message });
  }
});

// Instagram Downloader
app.get('/api/Instagram', validateApiKey, async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    const response = await axios.get(`https://social-dl.lmnx9.workers.dev?url=${encodeURIComponent(url)}`);
    res.json({
      success: true,
      platform: 'Instagram',
      data: response.data,
      download_url: response.data.video || response.data.url
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download Instagram video', details: error.message });
  }
});

// YouTube Downloader
app.get('/api/YouTube', validateApiKey, async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    const response = await axios.get(`https://api.lmnx9.shop/download/youtube.php?url=${encodeURIComponent(url)}`);
    res.json({
      success: true,
      platform: 'YouTube',
      data: response.data,
      download_url: response.data.download_url || response.data.url
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download YouTube video', details: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found. Use /api/health to see available endpoints' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`TNEH Video Downloader API running on port ${PORT}`);
  console.log(`API URL: https://tnehvideodwonloaderapi.onrender.com`);
});

module.exports = app;
