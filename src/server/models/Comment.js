const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  dislikesCount: {
    type: Number,
    default: 0
  },
  sentiment: {
    label: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral'
    },
    score: {
      type: Number,
      default: 0.5
    }
  },
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    sentiment: {
      label: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        default: 'neutral'
      },
      score: {
        type: Number,
        default: 0.5
      }
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    dislikes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    likesCount: {
      type: Number,
      default: 0
    },
    dislikesCount: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);

