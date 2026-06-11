const Folder = require('../models/Folder');
const Image = require('../models/Image');
const { cloudinary } = require('../config/cloudinary');

class FolderService {
  async createFolder(name, parentId, userId) {
    const folder = new Folder({ name, parentId, userId });
    return await folder.save();
  }

  async getFolderSize(folderId) {
    let size = 0;
    const images = await Image.find({ folderId });
    size += images.reduce((acc, img) => acc + img.size, 0);

    const subfolders = await Folder.find({ parentId: folderId });
    for (const sub of subfolders) {
      size += await this.getFolderSize(sub._id);
    }
    return size;
  }

  async getFolders(parentId, userId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const folders = await Folder.find({ parentId, userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return folders.map(f => f.toObject());
  }

  async getCurrentFolder(folderId, userId) {
    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) return null;
    const size = await this.getFolderSize(folderId);
    return { ...folder.toObject(), size };
  }

  async renameFolder(id, userId, newName) {
    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) throw new Error('Folder not found');
    folder.name = newName;
    return await folder.save();
  }

  async deleteFolderRecursive(id, userId) {
    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) throw new Error('Folder not found');

    // Find and delete images in this folder
    const images = await Image.find({ folderId: id });
    for (const img of images) {
      if (img.cloudinaryId) {
        await cloudinary.uploader.destroy(img.cloudinaryId).catch(console.error);
      }
      await Image.deleteOne({ _id: img._id });
    }

    // Find and delete subfolders recursively
    const subfolders = await Folder.find({ parentId: id });
    for (const sub of subfolders) {
      await this.deleteFolderRecursive(sub._id, userId);
    }

    // Finally delete this folder
    await Folder.deleteOne({ _id: id });
  }
}

module.exports = new FolderService();
