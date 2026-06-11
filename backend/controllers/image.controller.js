const imageService = require('../services/image.service');
const Image = require('../models/Image');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    
    let { name, folderId } = req.body;
    if (folderId === 'null' || folderId === '') folderId = null;
    
    const image = new Image({
      name: name || req.file.originalname,
      url: req.file.path,
      size: req.file.size,
      cloudinaryId: req.file.filename,
      folderId: folderId,
      userId: req.userId
    });
    
    await image.save();
    res.status(201).json(image);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getImages = async (req, res) => {
  try {
    let parentId = req.params.folderId || null;
    if (parentId === 'null') parentId = null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const images = await imageService.getImages(parentId, req.userId, page, limit);
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.renameImage = async (req, res) => {
  try {
    const image = await imageService.renameImage(req.params.id, req.userId, req.body.name);
    res.json(image);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    await imageService.deleteImage(req.params.id, req.userId);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
