require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/v1/auth.routes');
const folderRoutes = require('./routes/v1/folder.routes');
const imageRoutes = require('./routes/v1/image.routes');

const app = express();

// 1. CRITICAL: Trust the Render reverse proxy to allow 'secure' cookies over HTTPS
app.set('trust proxy', 1);

// 2. CRITICAL: Configure CORS to allow your exact production frontend URL (NO trailing slash)
app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://drive-clone-frontend.onrender.com' 
    : 'http://localhost:5173', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-idempotency-key']
}));

app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drive_clone')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/folders', folderRoutes);
app.use('/api/v1/images', imageRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
