const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const cors = require("cors");

dotenv.config({ path: ".env" });
dotenv.config({ path: "config/config.env" });

// Import Routes
const { redisClient } = require("./services/redisClient");
require("./services/mqttClient"); // logs MQTT broker connection status on boot
const authRoutes = require("./routes/authRoutes");
const cameraRoutes = require("./routes/cameraRoutes");
const streamRoutes = require("./routes/streamRoutes");
const aiRoutes = require("./routes/aiRoutes");
const settingRoutes = require("./routes/settingRoutes");
const alertRoutes = require("./routes/alertRoutes");
const adminRoutes = require("./routes/adminRoutes");
const operatorRoute = require("./routes/operatorRoutes");
const downtimeRoutes = require('./routes/downtimeRoutes');
const AnalyticsRoutes = require("./routes/AnalyticsRoutes"); 
const aisettingRoutes = require("./routes/aisettingRoutes");
const gpsRoutes = require('./routes/gpsRoutes');
const playbackRoutes = require('./routes/playbackRoutes');

const app = express();
app.set('trust proxy', true);



// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "https://localhost",
      "http://localhost",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://20.244.98.154:3002",
      "https://electionarcisai.vmukti.com:3002",
     "https://vmsai2026.vmukti.com:3002",
     "https://vmsai2026.vmukti.com:443",
      "https://vmsai2026.vmukti.com",
     "https://electionarcisai.vmukti.com:443",
      '*',
    ],
    credentials: true,
  })
);


// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/camera", cameraRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/setting", settingRoutes);
app.use("/api/alert", alertRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/operator",operatorRoute);
app.use('/api/downtime', downtimeRoutes);
app.use("/api/Analytics", AnalyticsRoutes);
app.use("/aisetting",aisettingRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/playback', playbackRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

module.exports = app;
