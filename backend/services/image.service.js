const Image = require('../models/Image');
const { cloudinary } = require('../config/cloudinary');

class ImageService {
  async getImages(folderId, userId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return await Image.find({ folderId, userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async renameImage(id, userId, newName) {
    const image = await Image.findOne({ _id: id, userId });
    if (!image) throw new Error('Image not found');
    image.name = newName;
    return await image.save();
  }

  async deleteImage(id, userId) {
    const image = await Image.findOne({ _id: id, userId });
    if (!image) throw new Error('Image not found');

    if (image.cloudinaryId) {
      await cloudinary.uploader.destroy(image.cloudinaryId).catch(console.error);
    }
    
    await Image.deleteOne({ _id: id });
  }
}

module.exports = new ImageService();
