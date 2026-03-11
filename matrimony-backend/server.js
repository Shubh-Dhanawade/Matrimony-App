const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const apiRoutes = require("./src/routes/api");

const path = require("path");

// Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api", apiRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Matrimony App API" });
});

// Port and Host
const PORT = process.env.PORT || 5472;
// const HOST = "0.0.0.0"; // Bind to all interfaces so Android device on LAN can connect

app.listen(PORT, () => {
  // console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Access from device: http://192.168.0.176:${PORT}`);
});
