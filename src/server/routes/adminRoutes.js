const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Book = require('../models/Book');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Ensure uploads directory exists safely across local and serverless environments
const uploadDir = process.env.VERCEL 
  ? path.join('/tmp', 'uploads') 
  : path.resolve(__dirname, '../../../uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('Upload directory check/create note:', err.message);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File Filter for PDF/EPUB and Image covers
const fileFilter = (req, file, cb) => {
  const allowedBookTypes = ['.pdf', '.epub'];
  const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'book' || file.fieldname === 'file' || file.fieldname === 'bookFile') {
    if (allowedBookTypes.includes(ext)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid book file format. Only PDF and EPUB are allowed.'));
  }

  if (file.fieldname === 'coverImage' || file.fieldname === 'cover') {
    if (allowedImageTypes.includes(ext)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid cover image format. Only JPG, PNG, and WEBP are allowed.'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter
});

// Protect all admin routes with verifyToken and isAdmin
router.use(verifyToken, isAdmin);

/**
 * POST /api/admin/upload
 * Admin book upload handler (PDF/EPUB + optional coverImage)
 * Forcefully sets isPublic: true
 */
router.post(
  '/upload',
  upload.fields([
    { name: 'book', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'bookFile', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const bookFile = req.files?.book?.[0] || req.files?.file?.[0] || req.files?.bookFile?.[0];
      const coverFile = req.files?.coverImage?.[0] || req.files?.cover?.[0];

      if (!bookFile) {
        return res.status(400).json({ message: 'Please upload a book file (PDF or EPUB).' });
      }

      const { title, author, description, category } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Book title is required.' });
      }

      const fileExtension = path.extname(bookFile.originalname).replace('.', '').toLowerCase();
      const bookFileUrl = `/uploads/${bookFile.filename}`;
      const coverImageUrl = coverFile ? `/uploads/${coverFile.filename}` : (req.body.coverImage || null);

      // Forcefully set isPublic: true for all admin uploads to feed the public library
      const newBook = new Book({
        title: title.trim(),
        author: author ? author.trim() : 'Unknown',
        description: description ? description.trim() : '',
        category: category ? category.trim() : 'General',
        fileUrl: bookFileUrl,
        fileType: fileExtension,
        coverImage: coverImageUrl,
        isPublic: true, // Forcefully set to true for public library feed
        uploadedBy: req.user._id,
        averageRating: req.body.averageRating ? Number(req.body.averageRating) : 0
      });

      await newBook.save();

      res.status(201).json({
        message: 'Book uploaded and published to public library successfully',
        book: newBook
      });

    } catch (error) {
      console.error('Admin book upload error:', error);
      res.status(500).json({ message: 'Server error during book upload: ' + error.message });
    }
  }
);

/**
 * PUT /api/admin/books/:id
 * Admin edit book handler:
 * Allows updating title, author, description, category, averageRating,
 * and optionally replacing bookFile and/or coverImage.
 */
router.put(
  '/books/:id',
  upload.fields([
    { name: 'book', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'bookFile', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const book = await Book.findById(req.params.id);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      const { title, author, description, category, averageRating, isPublic } = req.body;

      if (title !== undefined && title.trim()) book.title = title.trim();
      if (author !== undefined) book.author = author.trim() || 'Unknown';
      if (description !== undefined) book.description = description.trim();
      if (category !== undefined) book.category = category.trim();
      if (averageRating !== undefined && !isNaN(Number(averageRating))) {
        book.averageRating = Number(averageRating);
      }
      if (isPublic !== undefined) {
        book.isPublic = isPublic === true || isPublic === 'true';
      }

      // If new book file was uploaded, replace fileUrl and fileType
      const bookFile = req.files?.book?.[0] || req.files?.file?.[0] || req.files?.bookFile?.[0];
      if (bookFile) {
        const fileExtension = path.extname(bookFile.originalname).replace('.', '').toLowerCase();
        book.fileUrl = `/uploads/${bookFile.filename}`;
        book.fileType = fileExtension;
      }

      // If new cover was uploaded, replace coverImage
      const coverFile = req.files?.coverImage?.[0] || req.files?.cover?.[0];
      if (coverFile) {
        book.coverImage = `/uploads/${coverFile.filename}`;
      } else if (req.body.coverImageUrl) {
        book.coverImage = req.body.coverImageUrl;
      }

      await book.save();

      res.status(200).json({
        message: 'Book updated successfully',
        book
      });
    } catch (error) {
      console.error('Error updating book:', error);
      res.status(500).json({ message: 'Server error updating book: ' + error.message });
    }
  }
);

/**
 * DELETE /api/admin/books/:id
 * Admin delete book handler
 */
router.delete('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Remove local file if it was uploaded locally
    if (book.fileUrl && book.fileUrl.startsWith('/uploads/')) {
      const filePath = path.resolve(__dirname, '../..', book.fileUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
      }
    }
    if (book.coverImage && book.coverImage.startsWith('/uploads/')) {
      const coverPath = path.resolve(__dirname, '../..', book.coverImage.replace(/^\//, ''));
      if (fs.existsSync(coverPath)) {
        try { fs.unlinkSync(coverPath); } catch (e) { /* ignore */ }
      }
    }

    await Book.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: 'Book deleted successfully',
      bookId: req.params.id
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Server error deleting book: ' + error.message });
  }
});

/**
 * DELETE /api/admin/categories/:name
 * Admin delete category handler:
 * Re-assigns any existing books with this category to 'General' in MongoDB.
 */
router.delete('/categories/:name', async (req, res) => {
  try {
    const categoryName = decodeURIComponent(req.params.name);
    if (!categoryName || categoryName === 'All' || categoryName === 'General') {
      return res.status(400).json({ message: 'Cannot delete default category.' });
    }

    // Re-assign any books in this category to 'General'
    const result = await Book.updateMany({ category: categoryName }, { category: 'General' });

    res.status(200).json({
      message: `Category "${categoryName}" deleted. ${result.modifiedCount} book(s) moved to General.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error deleting category: ' + error.message });
  }
});

module.exports = router;
