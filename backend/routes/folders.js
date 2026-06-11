const express = require('express');
const Folder = require('../models/Folder');
const Image = require('../models/Image');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Create folder
router.post('/', async (req, res) => {
  try {
    const { name, parentId } = req.body;
    // ensure parentId is valid folder if provided
    let actualParentId = parentId;
    if (parentId === 'null' || parentId === '') {
      actualParentId = null;
    }
    const folder = new Folder({ name, parentId: actualParentId, userId: req.userId });
    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to get recursive size
async function getFolderSize(folderId) {
  let size = 0;
  // Get all images in this folder
  const images = await Image.find({ folderId });
  size += images.reduce((acc, img) => acc + img.size, 0);

  // Get subfolders
  const subfolders = await Folder.find({ parentId: folderId });
  for (const sub of subfolders) {
    size += await getFolderSize(sub._id);
  }
  return size;
}

// Get folder contents
router.get(['/', '/:id'], async (req, res) => {
  try {
    let parentId = req.params.id || null;
    if (parentId === 'null') parentId = null;

    const folders = await Folder.find({ parentId, userId: req.userId });
    const images = await Image.find({ folderId: parentId, userId: req.userId });

    // Calculate sizes for subfolders
    const foldersWithSize = await Promise.all(folders.map(async (f) => {
      const size = await getFolderSize(f._id);
      return { ...f.toObject(), size };
    }));

    // If viewing a specific folder, calculate its total size too
    let currentFolder = null;
    if (parentId) {
      currentFolder = await Folder.findOne({ _id: parentId, userId: req.userId });
      if (currentFolder) {
         currentFolder = currentFolder.toObject();
         currentFolder.size = await getFolderSize(parentId);
      }
    }

    res.json({ currentFolder, folders: foldersWithSize, images });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
