const Comment = require('../models/Comment');
const Book = require('../models/Book');
const { containsProfanity, getProfanityMatches } = require('../../utils/profanityFilter');

/**
 * GET /api/books/:bookId/comments
 * Paginated comments retrieval for a specific book (Requirement #1 & #8)
 */
const getComments = async (req, res) => {
  try {
    const { bookId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 5);
    const skip = (page - 1) * limit;

    const totalComments = await Comment.countDocuments({ book: bookId });
    const totalPages = Math.ceil(totalComments / limit) || 1;

    const comments = await Comment.find({ book: bookId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username name email role')
      .populate('replies.user', 'username name email role');

    // Extract current user ID if token was provided in header
    let currentUserId = null;
    if (req.user && req.user._id) {
      currentUserId = req.user._id.toString();
    }

    // Attach user-specific reaction indicator
    const formattedComments = comments.map((c) => {
      const doc = c.toObject();
      let userReaction = null;
      if (currentUserId) {
        if (c.likes && c.likes.some((id) => id.toString() === currentUserId)) {
          userReaction = 'like';
        } else if (c.dislikes && c.dislikes.some((id) => id.toString() === currentUserId)) {
          userReaction = 'dislike';
        }
      }
      doc.userReaction = userReaction;

      // Also attach userReaction for each reply
      doc.replies = (doc.replies || []).map((r) => {
        let replyUserReaction = null;
        if (currentUserId) {
          if (r.likes && r.likes.some((id) => id.toString() === currentUserId)) {
            replyUserReaction = 'like';
          } else if (r.dislikes && r.dislikes.some((id) => id.toString() === currentUserId)) {
            replyUserReaction = 'dislike';
          }
        }
        return {
          ...r,
          userReaction: replyUserReaction
        };
      });

      return doc;
    });

    res.status(200).json({
      success: true,
      count: formattedComments.length,
      totalComments,
      totalPages,
      currentPage: page,
      hasMore: page < totalPages,
      comments: formattedComments
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error fetching comments: ' + error.message });
  }
};

/**
 * POST /api/books/:bookId/comments
 * Post a new social comment with AI sentiment classification (Requirement #1 & #12)
 */
const createComment = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { content, sentiment } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content cannot be empty' });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({ message: 'Comment exceeds maximum allowed length of 1000 characters' });
    }

    // Content Moderation: Reject curse words and offensive profanity
    if (containsProfanity(content)) {
      const detected = getProfanityMatches(content);
      return res.status(400).json({
        message: `Inappropriate language detected. Curse words (${detected.map((w) => `"${w}"`).join(', ')}) are not allowed in discussions.`
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Default neutral sentiment if not provided
    const cleanSentiment = {
      label: sentiment && ['positive', 'negative', 'neutral'].includes(sentiment.label)
        ? sentiment.label
        : 'neutral',
      score: sentiment && typeof sentiment.score === 'number'
        ? Math.min(1, Math.max(0, sentiment.score))
        : 0.5
    };

    const newComment = new Comment({
      book: bookId,
      user: req.user._id,
      content: content.trim(),
      sentiment: cleanSentiment,
      likes: [],
      dislikes: [],
      likesCount: 0,
      dislikesCount: 0
    });

    await newComment.save();
    await newComment.populate('user', 'username name email role');

    const result = newComment.toObject();
    result.userReaction = null;

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      comment: result
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Server error posting comment: ' + error.message });
  }
};

/**
 * POST /api/comments/:commentId/reaction
 * Toggle Like or Dislike reaction on a comment (Requirement #3)
 */
const toggleReaction = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { type } = req.body; // 'like' | 'dislike'

    if (!['like', 'dislike'].includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type. Must be "like" or "dislike".' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const userIdStr = req.user._id.toString();
    const hasLiked = comment.likes.some((id) => id.toString() === userIdStr);
    const hasDisliked = comment.dislikes.some((id) => id.toString() === userIdStr);

    let currentReaction = null;

    if (type === 'like') {
      if (hasLiked) {
        // User clicked like again -> remove like (toggle off)
        comment.likes = comment.likes.filter((id) => id.toString() !== userIdStr);
        currentReaction = null;
      } else {
        // Add like and remove dislike if previously disliked
        comment.likes.push(req.user._id);
        if (hasDisliked) {
          comment.dislikes = comment.dislikes.filter((id) => id.toString() !== userIdStr);
        }
        currentReaction = 'like';
      }
    } else if (type === 'dislike') {
      if (hasDisliked) {
        // User clicked dislike again -> remove dislike (toggle off)
        comment.dislikes = comment.dislikes.filter((id) => id.toString() !== userIdStr);
        currentReaction = null;
      } else {
        // Add dislike and remove like if previously liked
        comment.dislikes.push(req.user._id);
        if (hasLiked) {
          comment.likes = comment.likes.filter((id) => id.toString() !== userIdStr);
        }
        currentReaction = 'dislike';
      }
    }

    comment.likesCount = comment.likes.length;
    comment.dislikesCount = comment.dislikes.length;

    await comment.save();

    res.status(200).json({
      success: true,
      commentId: comment._id,
      likesCount: comment.likesCount,
      dislikesCount: comment.dislikesCount,
      userReaction: currentReaction
    });

  } catch (error) {
    console.error('Error toggling reaction:', error);
    res.status(500).json({ message: 'Server error processing reaction: ' + error.message });
  }
};

/**
 * DELETE /api/comments/:commentId
 * Delete a comment (Author or Admin only)
 */
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this comment' });
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      commentId
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error deleting comment: ' + error.message });
  }
};

/**
 * POST /api/comments/:commentId/replies
 * Add a nested reply to a comment
 */
const addReply = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content, sentiment } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Reply content cannot be empty' });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({ message: 'Reply exceeds maximum allowed length of 1000 characters' });
    }

    // Content moderation: reject curse words
    if (containsProfanity(content)) {
      const detected = getProfanityMatches(content);
      return res.status(400).json({
        message: `Inappropriate language detected. Curse words (${detected.map((w) => `"${w}"`).join(', ')}) are not allowed in replies.`
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const cleanSentiment = {
      label: sentiment && ['positive', 'negative', 'neutral'].includes(sentiment.label)
        ? sentiment.label
        : 'neutral',
      score: sentiment && typeof sentiment.score === 'number'
        ? Math.min(1, Math.max(0, sentiment.score))
        : 0.5
    };

    const newReply = {
      user: req.user._id,
      content: content.trim(),
      sentiment: cleanSentiment,
      likes: [],
      dislikes: [],
      likesCount: 0,
      dislikesCount: 0,
      createdAt: new Date()
    };

    if (!comment.replies) {
      comment.replies = [];
    }

    comment.replies.push(newReply);
    await comment.save();
    await comment.populate('replies.user', 'username name email role');

    const createdReply = comment.replies[comment.replies.length - 1].toObject();
    createdReply.userReaction = null;

    res.status(201).json({
      success: true,
      message: 'Reply posted successfully',
      reply: createdReply,
      commentId: comment._id
    });

  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Server error adding reply: ' + error.message });
  }
};

/**
 * DELETE /api/comments/:commentId/replies/:replyId
 * Delete a specific reply (Reply owner or Admin only)
 */
const deleteReply = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const isOwner = reply.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this reply' });
    }

    comment.replies.pull(replyId);
    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Reply deleted successfully',
      commentId,
      replyId
    });

  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ message: 'Server error deleting reply: ' + error.message });
  }
};

/**
 * POST /api/comments/:commentId/replies/:replyId/reaction
 * Toggle Like or Dislike reaction on a reply
 */
const toggleReplyReaction = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    const { type } = req.body; // 'like' | 'dislike'

    if (!['like', 'dislike'].includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type. Must be "like" or "dislike".' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const userIdStr = req.user._id.toString();
    const hasLiked = reply.likes.some((id) => id.toString() === userIdStr);
    const hasDisliked = reply.dislikes.some((id) => id.toString() === userIdStr);

    let currentReaction = null;

    if (type === 'like') {
      if (hasLiked) {
        reply.likes = reply.likes.filter((id) => id.toString() !== userIdStr);
        currentReaction = null;
      } else {
        reply.likes.push(req.user._id);
        if (hasDisliked) {
          reply.dislikes = reply.dislikes.filter((id) => id.toString() !== userIdStr);
        }
        currentReaction = 'like';
      }
    } else if (type === 'dislike') {
      if (hasDisliked) {
        reply.dislikes = reply.dislikes.filter((id) => id.toString() !== userIdStr);
        currentReaction = null;
      } else {
        reply.dislikes.push(req.user._id);
        if (hasLiked) {
          reply.likes = reply.likes.filter((id) => id.toString() !== userIdStr);
        }
        currentReaction = 'dislike';
      }
    }

    reply.likesCount = reply.likes.length;
    reply.dislikesCount = reply.dislikes.length;

    await comment.save();

    res.status(200).json({
      success: true,
      commentId,
      replyId,
      likesCount: reply.likesCount,
      dislikesCount: reply.dislikesCount,
      userReaction: currentReaction
    });

  } catch (error) {
    console.error('Error toggling reply reaction:', error);
    res.status(500).json({ message: 'Server error toggling reply reaction: ' + error.message });
  }
};

module.exports = {
  getComments,
  createComment,
  toggleReaction,
  deleteComment,
  addReply,
  deleteReply,
  toggleReplyReaction
};

