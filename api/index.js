const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Keys storage (in production, use database)
const validKeys = new Map();

// Generate API Key
function generateApiKey() {
  return 'TNEH-' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Check if key is valid
function isKeyValid(key) {
  if (!validKeys.has(key)) return false;
  const expiryDate = validKeys.get(key);
  return new Date() < expiryDate;
}

// TikTok Downloader
async function downloadTikTok(url) {
  try {
    const response = await axios.get(`https://social-dl.lmnx9.workers.dev?url=${encodeURIComponent(url)}`);
    return {
      success: true,
      platform: 'TikTok',
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to download TikTok video'
    };
  }
}

// Facebook Downloader
async function downloadFacebook(url) {
  try {
    const response = await axios.get(`https://social-dl.lmnx9.workers.dev?url=${encodeURIComponent(url)}`);
    return {
      success: true,
      platform: 'Facebook',
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to download Facebook video'
    };
  }
}

// Instagram Downloader
async function downloadInstagram(url) {
  try {
    const response = await axios.get(`https://social-dl.lmnx9.workers.dev?url=${encodeURIComponent(url)}`);
    return {
      success: true,
      platform: 'Instagram',
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to download Instagram video'
    };
  }
}

// YouTube Downloader
async function downloadYouTube(url) {
  try {
    const response = await axios.get(`https://api.lmnx9.shop/download/youtube.php?url=${encodeURIComponent(url)}`);
    return {
      success: true,
      platform: 'YouTube',
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to download YouTube video'
    };
  }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/expiredate=7&createkey',
      '/api/expiredate=30&createkey',
      '/api/TikTok?key=&url=',
      '/api/Facebook?key=&url=',
      '/api/Instagram?key=&url=',
      '/api/YouTube?key=&url='
    ]
  });
});

// Create API Key with expiredate parameter
app.get('/api/expiredate=:days&createkey', (req, res) => {
  const days = parseInt(req.params.days);
  
  if (isNaN(days) || days <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid expiredate. Please provide a positive number of days'
    });
  }
  
  const apiKey = generateApiKey();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  validKeys.set(apiKey, expiryDate);
  
  res.json({
    success: true,
    api_key: apiKey,
    expiry_date: expiryDate.toISOString(),
    valid_days: days,
    message: `API key generated successfully. Valid for ${days} days.`
  });
});

// Alternative: Support both formats (for backward compatibility)
app.get('/api/createkey', (req, res) => {
  const { expiredate } = req.query;
  let days = 30; // default
  
  if (expiredate && !isNaN(parseInt(expiredate))) {
    days = parseInt(expiredate);
  }
  
  const apiKey = generateApiKey();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  validKeys.set(apiKey, expiryDate);
  
  res.json({
    success: true,
    api_key: apiKey,
    expiry_date: expiryDate.toISOString(),
    valid_days: days,
    message: `API key generated successfully. Valid for ${days} days.`
  });
});

// TikTok Endpoint
app.get('/api/TikTok', async (req, res) => {
  const { key, url } = req.query;
  
  if (!key || !url) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: key and url'
    });
  }
  
  if (!isKeyValid(key)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired API key'
    });
  }
  
  const result = await downloadTikTok(url);
  res.json(result);
});

// Facebook Endpoint
app.get('/api/Facebook', async (req, res) => {
  const { key, url } = req.query;
  
  if (!key || !url) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: key and url'
    });
  }
  
  if (!isKeyValid(key)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired API key'
    });
  }
  
  const result = await downloadFacebook(url);
  res.json(result);
});

// Instagram Endpoint
app.get('/api/Instagram', async (req, res) => {
  const { key, url } = req.query;
  
  if (!key || !url) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: key and url'
    });
  }
  
  if (!isKeyValid(key)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired API key'
    });
  }
  
  const result = await downloadInstagram(url);
  res.json(result);
});

// YouTube Endpoint
app.get('/api/YouTube', async (req, res) => {
  const { key, url } = req.query;
  
  if (!key || !url) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: key and url'
    });
  }
  
  if (!isKeyValid(key)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired API key'
    });
  }
  
  const result = await downloadYouTube(url);
  res.json(result);
});

// Start server
app.listen(PORT, () => {
  console.log(`TNEH Video Downloader API running on port ${PORT}`);
  console.log(`API URL: https://tnehvideodwonloaderapi.onrender.com`);
});
