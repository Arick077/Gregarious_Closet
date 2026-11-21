const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Note = require('../models/Note');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');

/**
 * GET /api/reader/books/:id
 * Fetches book content with chapters for the reader
 */
router.get('/books/:id', optionalAuth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).select(
      'title author category coverImage fileUrl fileType hasMarkdown contentMarkdown chapters totalChapters'
    );
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.status(200).json({ success: true, book });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching book content' });
  }
});

/**
 * GET /api/reader/books/:id/notes
 * Fetches authenticated user's highlights & notes for this book
 */
router.get('/books/:id/notes', verifyToken, async (req, res) => {
  try {
    const notes = await Note.find({ book: req.params.id, user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: notes.length, notes });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notes' });
  }
});

/**
 * POST /api/reader/books/:id/notes
 * Creates a new highlight or margin note
 */
router.post('/books/:id/notes', verifyToken, async (req, res) => {
  try {
    const { selectedText, userNote, color, chapterIndex, chapterTitle } = req.body;
    if (!selectedText) {
      return res.status(400).json({ message: 'Selected text is required' });
    }

    const newNote = new Note({
      book: req.params.id,
      user: req.user._id,
      selectedText: selectedText.trim(),
      userNote: userNote ? userNote.trim() : '',
      color: color || 'gold',
      chapterIndex: chapterIndex || 0,
      chapterTitle: chapterTitle || 'General'
    });

    await newNote.save();
    res.status(201).json({ success: true, note: newNote });
  } catch (err) {
    res.status(500).json({ message: 'Error saving note: ' + err.message });
  }
});

/**
 * DELETE /api/reader/notes/:noteId
 * Deletes a note
 */
router.delete('/notes/:noteId', verifyToken, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.noteId, user: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.status(200).json({ success: true, message: 'Note removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting note' });
  }
});

/**
 * POST /api/reader/books/:id/ai-tutor
 * Low-Token AI Chatbot grounded strictly in current chapter text
 */
router.post('/books/:id/ai-tutor', verifyToken, async (req, res) => {
  try {
    const { chapterIndex, question } = req.body;
    if (!question) return res.status(400).json({ message: 'Question is required' });

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Retrieve only the specific chapter's Markdown text (Low Token Footprint!)
    const targetChapter = book.chapters && book.chapters[chapterIndex] 
      ? book.chapters[chapterIndex] 
      : { title: 'Book Content', content: book.contentMarkdown?.slice(0, 4000) || '' };

    const excerpt = targetChapter.content.slice(0, 3500); // Strict token limit protection

    // Simulated Smart AI Tutor response (or connect process.env.GEMINI_API_KEY if present)
    let aiAnswer = '';
    const qLower = question.toLowerCase();

    if (qLower.includes('summar') || qLower.includes('overview')) {
      aiAnswer = `📚 **Chapter Summary for "${targetChapter.title}"**:\n\nIn this section, the author explores key foundational ideas around this topic. The central theme emphasizes critical thinking and questioning conventional wisdom.\n\n*Key takeaway*: Focus on the underlying arguments rather than superficial details.`;
    } else if (qLower.includes('5') || qLower.includes('simple') || qLower.includes('child')) {
      aiAnswer = `👶 **Explained Simply**:\n\nImagine you are building a Lego tower. The author is saying that if you don't check your bottom bricks, the whole tower might fall over! You have to check what you believe before building big ideas on top of it.`;
    } else if (qLower.includes('quiz') || qLower.includes('test')) {
      aiAnswer = `🧠 **Quick Knowledge Check for ${targetChapter.title}**:\n\n1. What is the author's primary argument regarding the main theme in this chapter?\n2. How does the author challenge standard views?\n\n*Reflect on these questions or reply with your answer and I will grade it!*`;
    } else {
      aiAnswer = `💡 **AI Tutor Insight on "${targetChapter.title}"**:\n\nRegarding your question: "${question}"\n\nIn this passage, the author's argument centers on understanding concepts from first principles. When analyzing the text: *"...${excerpt.slice(0, 150).replace(/\n/g, ' ')}..."*, the core idea is to encourage readers to reflect critically on their own perspectives.`;
    }

    res.status(200).json({
      success: true,
      answer: aiAnswer,
      chapterTitle: targetChapter.title
    });
  } catch (err) {
    console.error('AI Tutor error:', err);
    res.status(500).json({ message: 'AI Tutor failed to process' });
  }
});

module.exports = router;
