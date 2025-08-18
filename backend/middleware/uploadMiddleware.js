const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "../uploads");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Created uploads directory: ${uploadDir}`);
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const filename = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
  fileFilter: fileFilter,
});

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      message: 'File upload error: ' + err.message 
    });
  } else if (err) {
    return res.status(400).json({ 
      message: err.message 
    });
  }
  next();
};

// Cleanup function
const cleanupFiles = (files) => {
  if (files && Array.isArray(files)) {
    files.forEach(file => {
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          console.log(`🗑️ Cleaned up file: ${file.filename}`);
        } catch (error) {
          console.error(`❌ Failed to cleanup file: ${file.filename}`, error);
        }
      }
    });
  }
};

module.exports = {
  upload,
  handleMulterError,
  cleanupFiles,
  uploadDir
};