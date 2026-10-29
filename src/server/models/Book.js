const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    default: 'Unknown',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    default: 'General',
    trim: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    default: 'pdf'
  },
  coverImage: {
    type: String,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  ratings: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
