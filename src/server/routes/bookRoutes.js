const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Book = require('../models/Book');
const { verifyToken } = require('../middleware/authMiddleware');

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

  if (['book', 'file', 'bookFile'].includes(file.fieldname)) {
    if (allowedBookTypes.includes(ext)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid book file format. Only PDF and EPUB are allowed.'));
  }

  if (['coverImage', 'cover'].includes(file.fieldname)) {
    if (allowedImageTypes.includes(ext)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid cover image format. Only JPG, PNG, and WEBP are allowed.'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter
});

/**
 * GET /api/books/trending
 * Public route: Fetches public books sorted by highest rating & newest
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;

    const trendingBooks = await Book.find({ isPublic: true })
      .sort({ averageRating: -1, createdAt: -1 })
      .limit(limit)
      .populate('uploadedBy', 'username name email role');

    res.status(200).json({
      success: true,
      count: trendingBooks.length,
      books: trendingBooks
    });
  } catch (error) {
    console.error('Error fetching trending books:', error);
    res.status(500).json({ message: 'Server error fetching trending books' });
  }
});

/**
 * GET /api/books/my-books
 * Protected: Fetches all books uploaded by the current user (both public and private)
 */
router.get('/my-books', verifyToken, async (req, res) => {
  try {
    const myBooks = await Book.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: myBooks.length,
      books: myBooks
    });
  } catch (error) {
    console.error('Error fetching user books:', error);
    res.status(500).json({ message: 'Server error fetching your books' });
  }
});

/**
 * GET /api/books
 * Public route: Browse all public books with optional search and category filters
 */
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { isPublic: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'username name');

    res.status(200).json({
      success: true,
      count: books.length,
      books
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Server error fetching books' });
  }
});

/**
 * GET /api/books/:id
 * Public route: Fetch a single public book by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('uploadedBy', 'username name');

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Increment view count if public
    if (book.isPublic) {
      book.views = (book.views || 0) + 1;
      await book.save();
    }

    res.status(200).json({
      success: true,
      book
    });
  } catch (error) {
    console.error('Error fetching book details:', error);
    res.status(500).json({ message: 'Server error fetching book details' });
  }
});

/**
 * POST /api/books/upload
 * Protected route for ANY authenticated user to upload a book.
 * User can choose isPublic: true (public library) or isPublic: false (private vault).
 */
router.post(
  '/upload',
  verifyToken,
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

      const { title, author, description, category, averageRating } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Book title is required.' });
      }

      const fileExtension = path.extname(bookFile.originalname).replace('.', '').toLowerCase();
      const bookFileUrl = `/uploads/${bookFile.filename}`;
      const coverImageUrl = coverFile ? `/uploads/${coverFile.filename}` : (req.body.coverImage || null);

      // Support choosing public or private (default to false if not specified)
      const isPublic = req.body.isPublic === true || req.body.isPublic === 'true';

      const newBook = new Book({
        title: title.trim(),
        author: author ? author.trim() : 'Unknown',
        description: description ? description.trim() : '',
        category: category ? category.trim() : 'General',
        fileUrl: bookFileUrl,
        fileType: fileExtension,
        coverImage: coverImageUrl,
        isPublic: isPublic, // Set by the user
        uploadedBy: req.user._id,
        averageRating: averageRating ? Number(averageRating) : 4.8
      });

      await newBook.save();

      res.status(201).json({
        message: isPublic 
          ? 'Book uploaded and published to the public library!' 
          : 'Book uploaded to your private vault!',
        book: newBook
      });

    } catch (error) {
      console.error('Book upload error:', error);
      res.status(500).json({ message: 'Server error during book upload: ' + error.message });
    }
  }
);

/**
 * PUT /api/books/:id
 * Protected route: The book owner OR an admin can edit a book.
 * User can change visibility (isPublic: true/false), category, title, author, files, etc.
 */
router.put(
  '/:id',
  verifyToken,
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

      // Check ownership or admin status
      const isOwner = book.uploadedBy && book.uploadedBy.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to edit this book.' });
      }

      const { title, author, description, category, averageRating, isPublic } = req.body;

      if (title !== undefined && title.trim()) book.title = title.trim();
      if (author !== undefined) book.author = author.trim() || 'Unknown';
      if (description !== undefined) book.description = description.trim();
      if (category !== undefined) book.category = category.trim();
      if (averageRating !== undefined && !isNaN(Number(averageRating))) {
        book.averageRating = Number(averageRating);
      }
      
      // Allow user to toggle between public and private!
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
 * DELETE /api/books/:id
 * Protected route: The book owner OR an admin can delete a book.
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const isOwner = book.uploadedBy && book.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this book.' });
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

module.exports = router;
