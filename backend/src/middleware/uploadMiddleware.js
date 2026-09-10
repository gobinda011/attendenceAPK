const multer = require('multer');
const env = require('../config/environment');

// Face images and profile photos are received as multipart/form-data and
// held in memory just long enough to forward to the AI service / storage;
// we deliberately do not write raw uploads to disk permanently
// (Section 15: avoid unnecessary permanent storage of raw facial photographs).
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: env.uploadMaxSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  },
});

module.exports = upload;
