const mongoose = require("mongoose");

async function connectMongodb(url) {
  return mongoose
    .connect(url)
    .then(() => console.log("mongodb connected"))
    .catch((e) => {
      console.log("MongoDB connection error:", e.message);
      throw e;
    });
}

module.exports = { connectMongodb };
