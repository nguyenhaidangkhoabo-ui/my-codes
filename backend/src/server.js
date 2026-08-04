import 'dotenv/config'; // 🔐 NẠP BIẾN MÔI TRƯỜNG TỪ .env — đặt ngay đầu file
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import profileRoutes from './routes/profile.route.js';
import authRoutes from './routes/auth.route.js'; // 🔐 IMPORT ROUTE AUTH
import errorHandler from './middlewares/error.middleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Lấy __dirname trong ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global middleware
app.use(cors());
app.use(express.json());

// Serve frontend (nằm ngoài backend/)
app.use(express.static(path.join(__dirname, '../../frontend')));

// Endpoint test
app.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

// Mount routes
app.use('/profiles', profileRoutes);        // giữ nguyên
app.use('/api/auth', authRoutes);           // 🔐 MOUNT ROUTE AUTH MỚI

// Global error handler (PHẢI đặt cuối cùng)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});