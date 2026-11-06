const express = require('express');
const { authenticate, logActivity } = require('../middleware/auth');
const { upload, processImage, deleteImage, handleUploadError } = require('../middleware/upload');

const router = express.Router();

/**
 * POST /api/admin/upload
 * General upload endpoint for images (product, brand, banner, category)
 */
router.post('/', authenticate, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد ملف صورة للرفع',
      });
    }

    const folder = req.body.folder || 'products'; // 'products', 'banners', 'brands', 'categories'
    const result = await processImage(req.file.buffer, folder);

    logActivity({
      userId: req.user.id,
      action: 'upload_image',
      entityType: 'media',
      details: { folder, path: result.imagePath },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'تم رفع الصورة بنجاح',
      data: {
        url: result.imagePath,
        thumbnailUrl: result.thumbnailPath,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في معالجة وحفظ الصورة',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/upload
 * Delete an uploaded image file
 */
router.delete('/', authenticate, (req, res) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد مسار الصورة المراد حذفها',
      });
    }

    deleteImage(filePath);

    res.json({
      success: true,
      message: 'تم حذف الملف بنجاح',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ أثناء حذف الملف',
      error: error.message,
    });
  }
});

module.exports = router;
