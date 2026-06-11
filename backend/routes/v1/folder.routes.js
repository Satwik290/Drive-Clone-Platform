const express = require('express');
const router = express.Router();
const folderController = require('../../controllers/folder.controller');
const auth = require('../../middleware/auth');
const idempotency = require('../../middleware/idempotency');

router.use(auth);

router.post('/', idempotency, folderController.createFolder);
router.get(['/', '/:id'], folderController.getFolders);
router.put('/:id', idempotency, folderController.renameFolder);
router.delete('/:id', idempotency, folderController.deleteFolder);

module.exports = router;
