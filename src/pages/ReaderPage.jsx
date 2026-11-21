import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, BookOpen, Sparkles, Highlighter, Bookmark, 
  Menu, X, ChevronLeft, ChevronRight, Moon, Sun, 
  Trash2, Send, Bot, Check, FileText, RefreshCw, ExternalLink
} from 'lucide-react';

export default function ReaderPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();

  // Book & Content State
  const [book, setBook] = useState(null);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  // Reader Customization State
  const [fontSize, setFontSize] = useState(17); // in px
  const [theme, setTheme] = useState('dark'); // 'dark' (#141414), 'sepia' (#FBF0D9), 'paper' (#FAF7F2)

  // Highlights & Notes State
  const [notes, setNotes] = useState([]);
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [floatingBarPos, setFloatingBarPos] = useState(null);
  const [noteInputText, setNoteInputText] = useState('');
  const [isAddingNoteModal, setIsAddingNoteModal] = useState(false);

  // AI Tutor State
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your AI Book Tutor. Ask me any question about the chapter you are reading!' }
  ]);
  const [aiQuestionInput, setAiQuestionInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const readerContentRef = useRef(null);

  // 1. Fetch Book Data
  const fetchBook = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/reader/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.book) {
        setBook(data.book);
      } else {
        alert('Could not load book content.');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error fetching reader book:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
  }, [bookId]);

  // 2. Fetch User Notes
  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/reader/books/${bookId}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.notes) {
        setNotes(data.notes);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [bookId]);

  // On-Demand Convert Handler for existing books
  const handleConvertMarkdown = async () => {
    setIsConverting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/books/${bookId}/convert-markdown`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchBook();
      } else {
        alert(data.message || 'Conversion failed.');
      }
    } catch (err) {
      console.error('Error converting PDF:', err);
      alert('Failed to convert PDF.');
    } finally {
      setIsConverting(false);
    }
  };

  // 3. Mobile / Desktop Text Selection Handler for Highlights
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';

    if (text.length > 3) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setFloatingBarPos({
        top: Math.max(10, rect.top + window.scrollY - 50),
        left: Math.min(window.innerWidth - 200, Math.max(10, rect.left + rect.width / 2 - 100))
      });
    } else {
      setFloatingBarPos(null);
    }
  };

  // 4. Save Highlight or Note
  const handleSaveHighlight = async (color = 'gold', noteMessage = '') => {
    if (!selectedText) return;
    try {
      const token = localStorage.getItem('token');
      const activeChapter = book?.chapters?.[currentChapterIdx] || { title: 'General' };

      const res = await fetch(`/api/reader/books/${bookId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          selectedText,
          userNote: noteMessage,
          color,
          chapterIndex: currentChapterIdx,
          chapterTitle: activeChapter.title
        })
      });

      if (res.ok) {
        fetchNotes();
        setFloatingBarPos(null);
        setSelectedText('');
        setIsAddingNoteModal(false);
        setNoteInputText('');
        window.getSelection()?.removeAllRanges();
      }
    } catch (err) {
      console.error('Error saving highlight:', err);
    }
  };

  // 5. Delete Note
  const handleDeleteNote = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/reader/notes/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  // 6. Ask AI Tutor
  const handleAskAi = async (customPrompt = null) => {
    const question = customPrompt || aiQuestionInput;
    if (!question.trim()) return;

    const userMsg = { sender: 'user', text: question };
    setAiChatMessages((prev) => [...prev, userMsg]);
    setAiQuestionInput('');
    setIsAiLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/reader/books/${bookId}/ai-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          chapterIndex: currentChapterIdx,
          question
        })
      });

      const data = await res.json();
      if (res.ok && data.answer) {
        setAiChatMessages((prev) => [...prev, { sender: 'ai', text: data.answer }]);
      } else {
        setAiChatMessages((prev) => [...prev, { sender: 'ai', text: 'Sorry, I could not analyze that section right now.' }]);
      }
    } catch (err) {
      setAiChatMessages((prev) => [...prev, { sender: 'ai', text: 'Error communicating with AI study partner.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] text-[#F7F4EB] flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-5 h-5 border-2 border-[#C8A96A] border-t-transparent rounded-full animate-spin" />
          <span>Opening digital reader...</span>
        </div>
      </div>
    );
  }

  // Theme Styling Map
  const themeStyles = {
    dark: 'bg-[#141414] text-[#E0DFD5]',
    sepia: 'bg-[#FBF0D9] text-[#2C2416]',
    paper: 'bg-[#FAF7F2] text-[#1E1E1E]'
  };

  const hasChapters = book?.chapters && book.chapters.length > 0;
  const activeChapter = hasChapters
    ? book.chapters[currentChapterIdx]
    : {
        title: book?.title || 'Overview',
        content: book?.contentMarkdown || ''
      };

  return (
    <div className={`min-h-screen ${themeStyles[theme]} font-sans flex flex-col transition-colors selection:bg-[#C8A96A] selection:text-black`}>
      
      {/* ==================== READER NAVIGATION BAR ==================== */}
      <header className={`sticky top-0 z-30 border-b ${theme === 'dark' ? 'bg-[#181818]/95 border-[#292929]' : 'bg-white/90 border-black/10'} backdrop-blur-md px-3 sm:px-6 h-14 flex items-center justify-between gap-2`}>
        
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="font-serif font-bold text-sm sm:text-base truncate max-w-[140px] sm:max-w-xs">
              {book?.title}
            </h1>
            <p className="text-[10px] sm:text-xs text-[#A0A0A0] truncate">
              By {book?.author}
            </p>
          </div>
        </div>

        {/* Center: Chapter Jump (if chapters exist) */}
        {hasChapters && book.chapters.length > 1 && (
          <select
            value={currentChapterIdx}
            onChange={(e) => {
              setCurrentChapterIdx(Number(e.target.value));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hidden md:block max-w-[200px] text-xs py-1.5 px-2.5 rounded-xl border border-black/10 dark:border-[#333] bg-transparent font-medium cursor-pointer"
          >
            {book.chapters.map((ch, idx) => (
              <option key={idx} value={idx} className="bg-[#1e1e1e] text-[#F7F4EB]">
                {ch.title}
              </option>
            ))}
          </select>
        )}

        {/* Right: Controls & Drawers */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Font Resizing */}
          <div className="flex items-center border border-black/10 dark:border-[#333] rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setFontSize((f) => Math.max(13, f - 1))}
              className="px-2 py-1 font-bold hover:text-[#C8A96A]"
              title="Decrease font"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize((f) => Math.min(26, f + 1))}
              className="px-2 py-1 font-bold hover:text-[#C8A96A]"
              title="Increase font"
            >
              A+
            </button>
          </div>

          {/* Theme Toggle (Dark / Sepia / Paper) */}
          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'sepia' : t === 'sepia' ? 'paper' : 'dark'))}
            className="p-2 rounded-xl border border-black/10 dark:border-[#333] hover:text-[#C8A96A] transition-colors"
            title={`Switch Theme (Current: ${theme})`}
          >
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* Notes Drawer Button */}
          <button
            onClick={() => setIsNotesDrawerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-[#333] text-xs font-semibold hover:border-[#C8A96A] transition-all cursor-pointer"
          >
            <Bookmark size={14} className="text-[#C8A96A]" />
            <span className="hidden sm:inline">Notes</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#C8A96A]/20 text-[#C8A96A] font-bold">
              {notes.length}
            </span>
          </button>

          {/* AI Tutor Drawer Button */}
          <button
            onClick={() => setIsAiDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C8A96A] to-[#B59659] text-white text-xs font-semibold shadow hover:brightness-110 transition-all cursor-pointer"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">AI Tutor</span>
          </button>
        </div>
      </header>

      {/* ==================== MAIN REFLOWABLE READER AREA ==================== */}
      <main
        ref={readerContentRef}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
        className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 leading-relaxed tracking-normal select-text relative"
        style={{ fontSize: `${fontSize}px` }}
      >
        {/* If book has no converted markdown text yet */}
        {!hasChapters && !book?.contentMarkdown ? (
          <div className="py-16 text-center space-y-4 bg-black/10 dark:bg-white/5 rounded-3xl p-6 sm:p-10 border border-black/10 dark:border-white/10">
            <BookOpen size={48} className="mx-auto text-[#C8A96A] opacity-80" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold">Reflowable Text Pending</h2>
            <p className="text-xs sm:text-sm text-[#888] max-w-md mx-auto">
              This book has not yet been processed into Markdown chapters for mobile reading and AI study tutoring.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleConvertMarkdown}
                disabled={isConverting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C8A96A] to-[#B59659] text-white text-xs font-bold shadow-lg hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={isConverting ? 'animate-spin' : ''} />
                <span>{isConverting ? 'Extracting Markdown...' : 'Convert to Markdown Now'}</span>
              </button>
              {book?.fileUrl && (
                <a
                  href={book.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-black/20 dark:border-[#333] text-xs font-semibold hover:border-[#C8A96A] transition-all"
                >
                  <ExternalLink size={14} />
                  <span>Open Original File</span>
                </a>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 pb-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-widest text-[#C8A96A]">
                {activeChapter.title}
              </span>
              {hasChapters && book.chapters.length > 1 && (
                <span className="text-xs text-[#888888]">
                  Chapter {currentChapterIdx + 1} of {book.chapters.length}
                </span>
              )}
            </div>

            {/* Reflowable Markdown Text */}
            <article className="prose dark:prose-invert max-w-none space-y-4">
              <ReactMarkdown>{activeChapter.content}</ReactMarkdown>
            </article>

            {/* Chapter Navigation Pagination at Bottom */}
            {hasChapters && book.chapters.length > 1 && (
              <div className="flex items-center justify-between pt-10 mt-10 border-t border-black/10 dark:border-white/10 text-xs font-semibold">
                <button
                  disabled={currentChapterIdx <= 0}
                  onClick={() => {
                    setCurrentChapterIdx((prev) => Math.max(0, prev - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-black/10 dark:border-[#333] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#C8A96A]"
                >
                  <ChevronLeft size={16} />
                  <span>Previous Chapter</span>
                </button>

                <button
                  disabled={currentChapterIdx >= book.chapters.length - 1}
                  onClick={() => {
                    setCurrentChapterIdx((prev) => Math.min(book.chapters.length - 1, prev + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8A96A] text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span>Next Chapter</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ==================== FLOATING HIGHLIGHT & NOTE TOOLBAR ==================== */}
      {floatingBarPos && (
        <div
          style={{ top: `${floatingBarPos.top}px`, left: `${floatingBarPos.left}px` }}
          className="fixed z-40 flex items-center gap-1 p-1 rounded-2xl bg-[#1e1e1e] border border-[#C8A96A]/60 shadow-2xl animate-fadeIn"
        >
          {/* Gold Highlight */}
          <button
            onClick={() => handleSaveHighlight('gold')}
            className="p-2 rounded-xl hover:bg-yellow-500/20 text-yellow-400 cursor-pointer"
            title="Highlight in Gold"
          >
            <Highlighter size={16} />
          </button>

          {/* Emerald Highlight */}
          <button
            onClick={() => handleSaveHighlight('emerald')}
            className="p-2 rounded-xl hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
            title="Highlight in Emerald"
          >
            <Highlighter size={16} />
          </button>

          {/* Rose Highlight */}
          <button
            onClick={() => handleSaveHighlight('rose')}
            className="p-2 rounded-xl hover:bg-rose-500/20 text-rose-400 cursor-pointer"
            title="Highlight in Rose"
          >
            <Highlighter size={16} />
          </button>

          {/* Add Margin Note */}
          <button
            onClick={() => setIsAddingNoteModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#2a2a2a] hover:bg-[#C8A96A] hover:text-black text-xs font-semibold text-[#F7F4EB] transition-colors cursor-pointer"
          >
            <FileText size={13} />
            <span>Note</span>
          </button>
        </div>
      )}

      {/* ==================== ADD MARGIN NOTE MODAL ==================== */}
      {isAddingNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] border border-[#333] rounded-3xl p-5 max-w-md w-full space-y-3 shadow-2xl">
            <h3 className="font-serif font-bold text-base text-[#F7F4EB] flex items-center gap-2">
              <Bookmark size={16} className="text-[#C8A96A]" />
              <span>Add Personal Note</span>
            </h3>

            <div className="p-3 bg-[#141414] rounded-xl text-xs text-[#A0A0A0] italic border-l-2 border-[#C8A96A] line-clamp-3">
              "{selectedText}"
            </div>

            <textarea
              rows={3}
              value={noteInputText}
              onChange={(e) => setNoteInputText(e.target.value)}
              placeholder="Write your observation, question, or study note..."
              className="w-full p-3 bg-[#141414] border border-[#333] rounded-xl text-xs text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A]"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsAddingNoteModal(false);
                  setFloatingBarPos(null);
                }}
                className="px-4 py-1.5 text-xs text-[#888] hover:text-[#fff] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveHighlight('gold', noteInputText)}
                className="px-4 py-1.5 rounded-xl bg-[#C8A96A] text-black text-xs font-bold shadow hover:brightness-110 cursor-pointer"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== NOTES & HIGHLIGHTS DRAWER ==================== */}
      {isNotesDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-[#181818] border-l border-[#2e2e2e] shadow-2xl flex flex-col p-5 space-y-4 animate-slideLeft">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e]">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-[#F7F4EB]">
                <Bookmark size={17} className="text-[#C8A96A]" />
                <span>My Notes & Highlights ({notes.length})</span>
              </div>
              <button onClick={() => setIsNotesDrawerOpen(false)} className="p-1 rounded-lg hover:bg-white/10 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {notes.length === 0 ? (
                <div className="text-center py-16 text-xs text-[#777]">
                  No highlights or notes yet. Select any text while reading to highlight or write a note!
                </div>
              ) : (
                notes.map((n) => (
                  <div key={n._id} className="p-3.5 rounded-2xl bg-[#202020] border border-[#333] space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-[#A0A0A0]">
                      <span className="font-semibold text-[#C8A96A]">{n.chapterTitle}</span>
                      <button onClick={() => handleDeleteNote(n._id)} className="text-[#666] hover:text-red-400 cursor-pointer">
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <p className={`text-xs text-[#E0DFD5] italic border-l-2 pl-2 ${
                      n.color === 'emerald' ? 'border-emerald-400' : n.color === 'rose' ? 'border-rose-400' : 'border-[#C8A96A]'
                    }`}>
                      "{n.selectedText}"
                    </p>

                    {n.userNote && (
                      <p className="text-xs text-[#F7F4EB] bg-[#181818] p-2 rounded-lg font-medium">
                        📝 {n.userNote}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== AI BOOK TUTOR DRAWER ==================== */}
      {isAiDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-[#181818] border-l border-[#2e2e2e] shadow-2xl flex flex-col p-5 space-y-4 animate-slideLeft">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e]">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-[#F7F4EB]">
                <Bot size={18} className="text-[#C8A96A]" />
                <span className="truncate max-w-[260px]">AI Study Tutor ({activeChapter.title})</span>
              </div>
              <button onClick={() => setIsAiDrawerOpen(false)} className="p-1 rounded-lg hover:bg-white/10 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Quick Prompt Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              <button
                onClick={() => handleAskAi('Summarize this chapter')}
                className="px-2.5 py-1 rounded-full bg-[#242424] hover:bg-[#C8A96A] hover:text-black text-[#C8A96A] border border-[#C8A96A]/30 shrink-0 font-medium cursor-pointer"
              >
                💡 Summarize Chapter
              </button>
              <button
                onClick={() => handleAskAi('Explain this like I am 5')}
                className="px-2.5 py-1 rounded-full bg-[#242424] hover:bg-[#C8A96A] hover:text-black text-[#C8A96A] border border-[#C8A96A]/30 shrink-0 font-medium cursor-pointer"
              >
                👶 Explain Simply
              </button>
              <button
                onClick={() => handleAskAi('Give me a 3-question quiz on this chapter')}
                className="px-2.5 py-1 rounded-full bg-[#242424] hover:bg-[#C8A96A] hover:text-black text-[#C8A96A] border border-[#C8A96A]/30 shrink-0 font-medium cursor-pointer"
              >
                🧠 Quiz Me
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {aiChatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-[#C8A96A] text-black font-semibold ml-6 rounded-tr-xs'
                      : 'bg-[#222222] text-[#F7F4EB] mr-4 rounded-tl-xs border border-[#333]'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              ))}
              {isAiLoading && (
                <div className="p-3 bg-[#222] rounded-2xl text-xs text-[#888] flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#C8A96A] border-t-transparent rounded-full animate-spin" />
                  <span>AI Tutor is reviewing the chapter...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="pt-2 border-t border-[#2e2e2e] flex items-center gap-2">
              <input
                type="text"
                value={aiQuestionInput}
                onChange={(e) => setAiQuestionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                placeholder="Ask about this chapter..."
                className="flex-1 py-2 px-3.5 bg-[#141414] border border-[#333] rounded-xl text-xs text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A]"
              />
              <button
                onClick={() => handleAskAi()}
                disabled={isAiLoading || !aiQuestionInput.trim()}
                className="p-2 rounded-xl bg-[#C8A96A] text-black font-bold disabled:opacity-30 hover:brightness-110 cursor-pointer"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
