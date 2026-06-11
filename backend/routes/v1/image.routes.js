const express = require('express');
const router = express.Router();
const imageController = require('../../controllers/image.controller');
const auth = require('../../middleware/auth');
const idempotency = require('../../middleware/idempotency');
const { upload } = require('../../config/cloudinary');

router.use(auth);

router.post('/', idempotency, upload.single('image'), imageController.uploadImage);
router.get(['/', '/:folderId'], imageController.getImages);
router.put('/:id', idempotency, imageController.renameImage);
router.delete('/:id', idempotency, imageController.deleteImage);

module.exports = router;
