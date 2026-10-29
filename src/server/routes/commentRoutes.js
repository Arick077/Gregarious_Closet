const express = require('express');
const router = express.Router();
const { 
  getComments, 
  createComment, 
  toggleReaction, 
  deleteComment,
  addReply,
  deleteReply,
  toggleReplyReaction
} = require('../controllers/commentController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');

// Get paginated comments for a book (Requirement #1 & #8)
router.get('/books/:bookId/comments', optionalAuth, getComments);

// Post a new comment on a book with AI sentiment (Requirement #1 & #12)
router.post('/books/:bookId/comments', verifyToken, createComment);

// Toggle like or dislike on a comment (Requirement #3)
router.post('/comments/:commentId/reaction', verifyToken, toggleReaction);

// Delete a comment (Author or Admin only)
router.delete('/comments/:commentId', verifyToken, deleteComment);

// Nested Replies endpoints
router.post('/comments/:commentId/replies', verifyToken, addReply);
router.delete('/comments/:commentId/replies/:replyId', verifyToken, deleteReply);
router.post('/comments/:commentId/replies/:replyId/reaction', verifyToken, toggleReplyReaction);

module.exports = router;

