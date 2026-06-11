const express = require('express');
const Image = require('../models/Image');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();
router.use(auth);

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    
    let { name, folderId } = req.body;
    if (folderId === 'null' || folderId === '') {
      folderId = null;
    }
    const image = new Image({
      name: name || req.file.originalname,
      url: req.file.path,
      size: req.file.size,
      folderId: folderId,
      userId: req.userId
    });
    
    await image.save();
    res.status(201).json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
