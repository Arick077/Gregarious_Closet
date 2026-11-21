const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  selectedText: {
    type: String,
    required: true,
    trim: true
  },
  userNote: {
    type: String,
    default: '',
    trim: true
  },
  color: {
    type: String,
    enum: ['gold', 'emerald', 'rose', 'blue'],
    default: 'gold'
  },
  chapterIndex: {
    type: Number,
    default: 0
  },
  chapterTitle: {
    type: String,
    default: 'General'
  }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
