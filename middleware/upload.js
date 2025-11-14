const multer = require("multer");

const storage = multer.memoryStorage(); // <--- IMPORTANT

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files allowed"), false);
};

module.exports = multer({ storage, fileFilter });
