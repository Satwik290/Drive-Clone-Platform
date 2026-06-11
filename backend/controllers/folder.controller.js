const folderService = require('../services/folder.service');

exports.createFolder = async (req, res) => {
  try {
    let { name, parentId } = req.body;
    if (parentId === 'null' || parentId === '') parentId = null;
    const folder = await folderService.createFolder(name, parentId, req.userId);
    res.status(201).json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFolders = async (req, res) => {
  try {
    let parentId = req.params.id || null;
    if (parentId === 'null') parentId = null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const folders = await folderService.getFolders(parentId, req.userId, page, limit);
    
    let currentFolder = null;
    if (parentId) {
      currentFolder = await folderService.getCurrentFolder(parentId, req.userId);
    }

    res.json({ currentFolder, folders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.renameFolder = async (req, res) => {
  try {
    const folder = await folderService.renameFolder(req.params.id, req.userId, req.body.name);
    res.json(folder);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    await folderService.deleteFolderRecursive(req.params.id, req.userId);
    res.json({ message: 'Folder deleted' });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
