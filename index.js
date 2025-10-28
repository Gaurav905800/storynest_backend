require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { connectMongodb } = require("./connection.js");
const blogRoutes = require("./routes/post.routes.js");
const userRoutes = require("./routes/user.routes.js");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api/blogs", blogRoutes);
app.use("/api/auth", userRoutes);

const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) =>
  res.json({ status: "OK", service: "Storynest is on" })
);

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI;
connectMongodb(MONGODB_URI);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
