const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cluster = require('cluster');
const os = require('os');

// Load environment variables
dotenv.config();

const numCPUs = os.cpus().length;

if (cluster.isPrimary || cluster.isMaster) {
  console.log(`📡 Primary system active [Process: ${process.pid}]`);
  console.log(`⚙️ Scaling to ${numCPUs} CPU cores...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} died. Forcing neural restart...`);
    cluster.fork();
  });
} else {
  const app = express();
  const PORT = process.env.PORT || 5000;

  // Security & Performance Middleware
  app.use(helmet());
  app.use(compression());
  
  const corsOptions = {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
    credentials: true,
  };
  app.use(cors(corsOptions));
  
  app.use(express.json({ limit: '50mb' })); // High-capacity payload limit

  // Rate Limiting (Neural Shield)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, 
    message: { error: 'Neural limit exceeded. Please wait for sync.' }
  });
  app.use('/api/', limiter);

  // Database Connection
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codeforge', {
    maxPoolSize: 50, // Optimize connection pool for high concurrency
  })
    .then(() => console.log(`✅ Worker ${process.pid} synced to MongoDB`))
    .catch(err => {
      console.error('❌ MongoDB Connection Error:', err.message);
      process.exit(1);
    });

  // Routes
  const authRoutes = require('./routes/auth');
  const snippetRoutes = require('./routes/snippets');

  app.use('/api/auth', authRoutes);
  app.use('/api/snippets', snippetRoutes);

  // Health Check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      uptime: process.uptime(),
      worker: process.pid,
      timestamp: new Date() 
    });
  });

  // Start Server
  app.listen(PORT, () => {
    console.log(`🚀 Worker ${process.pid} active on http://localhost:${PORT}`);
  });
}
