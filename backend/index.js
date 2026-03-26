const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const Room = require("./models/Room");
const { validateEnv, getAllowedOrigins } = require("./utils/env");

// Load environment variables
dotenv.config();
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const allowedOrigins = getAllowedOrigins();
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS not allowed"), false);
    },
    credentials: true,
  }),
);

const baseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(baseLimiter);

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/codeforge")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// Socket.io Collaboration Logic
const Y = require("yjs");
const roomDocs = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", async (roomId, user) => {
    socket.join(roomId);
    console.log(
      `User ${socket.id} (${user?.name || "Guest"}) joined room ${roomId}`,
    );

    // Get or Create Yjs Doc for the room
    if (!roomDocs.has(roomId)) {
      // Try to load from DB
      const dbRoom = await Room.findOne({ roomId });
      const doc = new Y.Doc();
      if (dbRoom) {
        Y.applyUpdate(doc, new Uint8Array(dbRoom.state));
        console.log(`Loaded room ${roomId} from DB`);
      }
      roomDocs.set(roomId, doc);
    }
    const doc = roomDocs.get(roomId);

    // Send current state to the new user
    const state = Y.encodeStateAsUpdate(doc);
    socket.emit("initial-sync", Buffer.from(state));

    // Notify others
    socket.to(roomId).emit("user-joined", { id: socket.id, user });

    socket.on("disconnect", () => {
      console.log(`User ${socket.id} left room ${roomId}`);
      socket.to(roomId).emit("user-left", socket.id);
    });
  });

  // Relay YJS updates and PERSIST them in backend doc
  socket.on("sync-update", (roomId, update) => {
    const doc = roomDocs.get(roomId);
    if (doc) {
      try {
        const uint8Update = new Uint8Array(update);
        Y.applyUpdate(doc, uint8Update);
        console.log(
          `Sync update applied to room ${roomId} (Size: ${uint8Update.length} bytes)`,
        );
      } catch (err) {
        console.error(`Error applying YJS update in room ${roomId}:`, err);
      }
    }
    socket.to(roomId).emit("sync-update", update);
  });

  // Relay Awareness updates
  socket.on("awareness-update", (roomId, update) => {
    socket.to(roomId).emit("awareness-update", update);
  });
});

// Persistence Loop: Save docs to DB every 60 seconds
setInterval(async () => {
  for (const [roomId, doc] of roomDocs.entries()) {
    try {
      const state = Y.encodeStateAsUpdate(doc);
      await Room.findOneAndUpdate(
        { roomId },
        {
          state: Buffer.from(state),
          lastActivity: new Date(),
        },
        { upsert: true, new: true },
      );
    } catch (err) {
      console.error(`Error persisting doc for room ${roomId}:`, err);
    }
  }
}, 60000);

// Routes
const authRoutes = require("./routes/auth");
const snippetRoutes = require("./routes/snippets");
const voiceRoutes = require("./routes/voice");
const workspaceRoutes = require("./routes/workspaces");
const billingRoutes = require("./routes/billing");

app.use("/api/auth", authRoutes);
app.use("/api/snippets", snippetRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/billing", billingRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message || err);
  res.status(500).json({ error: "Internal server error" });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
