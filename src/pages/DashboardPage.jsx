import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, LogOut, Plus, Sparkles, BookMarked, Compass, Clock, User, 
  Flame, Search, ChevronRight, ChevronLeft, ShieldCheck, Star, BookmarkCheck,
  Pencil, Trash2, FolderPlus, X, Lock, Globe
} from 'lucide-react';
import logo from '../assets/logo.png';
import BookCard from '../components/BookCard';
import AdminUploadModal from '../components/AdminUploadModal';
import EditBookModal from '../components/EditBookModal';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBookForView, setSelectedBookForView] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Custom Categories State (Persisted in localStorage)
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Removed Categories State (Persisted in localStorage so deleted categories stay deleted)
  const [removedCategories, setRemovedCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('removed_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const carouselRef = useRef(null);
  const myBooksCarouselRef = useRef(null);

  const fetchTrendingBooks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/books/trending');
      const data = await response.json();
      if (response.ok && data.books) {
        setTrendingBooks(data.books);
      }
    } catch (err) {
      console.error('Error fetching trending books:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyBooks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/books/my-books', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.books) {
        setMyBooks(data.books);
      }
    } catch (err) {
      console.error('Error fetching my books:', err);
    }
  };

  // Load User & Fetch Data
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      navigate('/auth');
      return;
    }

    try {
      setCurrentUser(storedUser ? JSON.parse(storedUser) : null);
    } catch {
      setCurrentUser(null);
    }

    fetchTrendingBooks();
    fetchMyBooks();
  }, [navigate]);

  // Dynamically extract all available categories (defaults + custom + existing books minus removed)
  const defaultCategories = ['Philosophy', 'Productivity', 'History', 'Technology', 'Science', 'Fiction'];
  const allCategories = Array.from(
    new Set([
      ...defaultCategories,
      ...customCategories,
      ...trendingBooks.map((b) => b.category).filter(Boolean),
      ...myBooks.map((b) => b.category).filter(Boolean)
    ])
  ).filter((cat) => !removedCategories.includes(cat));

  const categories = ['All', ...allCategories];

  // Top 5 books for the featured hero rotation
  const heroBooks = trendingBooks.slice(0, 5);
  const featuredBook = heroBooks.length > 0 ? heroBooks[featuredIndex % heroBooks.length] : null;

  // Auto-rotate Hero Banner every 5 seconds (pauses on hover)
  useEffect(() => {
    if (heroBooks.length <= 1 || isBannerPaused) return;

    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % heroBooks.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroBooks.length, isBannerPaused]);

  const handleNextHero = () => {
    setFeaturedIndex((prev) => (prev + 1) % heroBooks.length);
  };

  const handlePrevHero = () => {
    setFeaturedIndex((prev) => (prev - 1 + heroBooks.length) % heroBooks.length);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const handleOpenEdit = (book) => {
    setBookToEdit(book);
    setIsEditModalOpen(true);
  };

  const handleBookUpdated = (updatedBook, newCategory) => {
    // 1. Update in personal bookshelf
    setMyBooks((prev) =>
      prev.map((b) => (b._id === updatedBook._id ? updatedBook : b))
    );

    // 2. If public, update or add to trending; if private, remove from trending
    if (updatedBook.isPublic) {
      setTrendingBooks((prev) => {
        const exists = prev.some((b) => b._id === updatedBook._id);
        if (exists) {
          return prev.map((b) => (b._id === updatedBook._id ? updatedBook : b));
        } else {
          return [updatedBook, ...prev];
        }
      });
    } else {
      setTrendingBooks((prev) => prev.filter((b) => b._id !== updatedBook._id));
    }

    // 3. Category persistence if new
    if (newCategory) {
      if (removedCategories.includes(newCategory)) {
        const unRemoved = removedCategories.filter((c) => c !== newCategory);
        setRemovedCategories(unRemoved);
        localStorage.setItem('removed_categories', JSON.stringify(unRemoved));
      }
      if (!allCategories.includes(newCategory)) {
        const updated = Array.from(new Set([...customCategories, newCategory]));
        setCustomCategories(updated);
        localStorage.setItem('custom_categories', JSON.stringify(updated));
      }
    }

    if (selectedBookForView?._id === updatedBook._id) {
      setSelectedBookForView(updatedBook);
    }
  };

  const handleBookDeleted = (deletedBookId) => {
    setTrendingBooks((prev) => prev.filter((b) => b._id !== deletedBookId));
    setMyBooks((prev) => prev.filter((b) => b._id !== deletedBookId));
    if (selectedBookForView?._id === deletedBookId) {
      setSelectedBookForView(null);
    }
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;

    const formatted = newCategoryInput.trim();
    
    // If it was previously removed, un-remove it
    if (removedCategories.includes(formatted)) {
      const updatedRemoved = removedCategories.filter((c) => c !== formatted);
      setRemovedCategories(updatedRemoved);
      localStorage.setItem('removed_categories', JSON.stringify(updatedRemoved));
    }

    if (!allCategories.includes(formatted)) {
      const updated = [...customCategories, formatted];
      setCustomCategories(updated);
      localStorage.setItem('custom_categories', JSON.stringify(updated));
    }

    setSelectedCategory(formatted);
    setNewCategoryInput('');
    setIsAddCategoryModalOpen(false);
  };

  const handleDeleteCategory = async (catToDelete) => {
    if (catToDelete === 'All') return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the category "${catToDelete}"?\n\nAny books currently in "${catToDelete}" will be moved to "General".`
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`/api/admin/categories/${encodeURIComponent(catToDelete)}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      const updatedRemoved = Array.from(new Set([...removedCategories, catToDelete]));
      setRemovedCategories(updatedRemoved);
      localStorage.setItem('removed_categories', JSON.stringify(updatedRemoved));

      const updatedCustom = customCategories.filter((c) => c !== catToDelete);
      setCustomCategories(updatedCustom);
      localStorage.setItem('custom_categories', JSON.stringify(updatedCustom));

      setTrendingBooks((prev) =>
        prev.map((b) => (b.category === catToDelete ? { ...b, category: 'General' } : b))
      );
      setMyBooks((prev) =>
        prev.map((b) => (b.category === catToDelete ? { ...b, category: 'General' } : b))
      );

      if (selectedCategory === catToDelete) {
        setSelectedCategory('All');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Could not delete category: ' + err.message);
    }
  };

  const scrollCarousel = (direction, ref) => {
    const targetRef = ref || carouselRef;
    if (targetRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      targetRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const filteredBooks = trendingBooks.filter((book) => {
    const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const isAdmin = currentUser?.role === 'admin';

  const canEditSelectedBook = selectedBookForView && (
    isAdmin || (currentUser && selectedBookForView.uploadedBy && (
      String(currentUser._id || currentUser.id) === String(selectedBookForView.uploadedBy._id || selectedBookForView.uploadedBy)
    ))
  );

  return (
    <div className="min-h-screen bg-[#141414] text-[#F7F4EB] font-sans flex flex-col selection:bg-[#C8A96A] selection:text-black">
      
      {/* ==================== TOP NAVIGATION BAR ==================== */}
      <header className="border-b border-[#292929] bg-[#181818]/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-9 h-9 object-contain" />
              <span className="font-serif font-bold text-lg tracking-wide text-[#F7F4EB]">
                Gregarious<span className="text-[#C8A96A] italic">Closet</span>
              </span>
            </Link>

            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C8A96A]/10 border border-[#C8A96A]/20 text-[11px] font-semibold text-[#C8A96A]">
              <Flame size={12} className="text-[#C8A96A]" />
              <span>Public Library Feed</span>
            </span>
          </div>

          {/* User Controls & Book Upload CTA */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Universal Upload Button (Accessible to all authenticated users) */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#C8A96A] to-[#B59659] text-white text-xs font-semibold shadow-md hover:brightness-110 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">{isAdmin ? 'Publish Book' : 'Add Book'}</span>
              <span className="sm:hidden">Add</span>
            </button>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#202020] border border-[#333333]">
              <div className="w-6 h-6 rounded-full bg-[#8FAE9B]/20 text-[#8FAE9B] flex items-center justify-center font-bold text-xs uppercase">
                {currentUser?.name ? currentUser.name[0] : <User size={13} />}
              </div>
              <span className="text-xs font-medium text-[#F7F4EB] pr-1 max-w-[100px] truncate">
                {currentUser?.username || currentUser?.name || 'Reader'}
              </span>
              {isAdmin && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C8A96A] text-black uppercase">
                  Admin
                </span>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-[#A0A0A0] hover:text-[#F7F4EB] p-2 sm:px-3 sm:py-1.5 rounded-xl hover:bg-[#202020] transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-10">

        {/* 1. NETFLIX BILLBOARD / FEATURED HERO BANNER (AUTO-ROTATING) */}
        {featuredBook && (
          <div 
            onMouseEnter={() => setIsBannerPaused(true)}
            onMouseLeave={() => setIsBannerPaused(false)}
            className="group relative rounded-3xl overflow-hidden border border-[#333333] shadow-2xl min-h-[360px] md:min-h-[440px] flex items-end transition-all duration-700"
          >
            {/* Background Cover Image with Gradients */}
            <div className="absolute inset-0 z-0">
              <img
                key={featuredBook._id}
                src={featuredBook.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=1200'}
                alt={featuredBook.title}
                className="w-full h-full object-cover object-center filter brightness-40 blur-[1px] transform scale-105 transition-all duration-1000 ease-in-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/75 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/85 to-transparent" />
            </div>

            {/* Navigation Arrows for the Hero Banner */}
            {heroBooks.length > 1 && (
              <>
                <button
                  onClick={handlePrevHero}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/50 hover:bg-[#C8A96A] text-white hover:text-black border border-white/10 hover:border-[#C8A96A] backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer shadow-lg"
                  aria-label="Previous Featured Book"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNextHero}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/50 hover:bg-[#C8A96A] text-white hover:text-black border border-white/10 hover:border-[#C8A96A] backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer shadow-lg"
                  aria-label="Next Featured Book"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Featured Content Details */}
            <div 
              key={`content-${featuredBook._id}`} 
              className="relative z-10 p-6 sm:p-10 max-w-2xl space-y-4 animate-fadeIn"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8A96A] text-black text-xs font-bold uppercase tracking-wider shadow">
                  <Sparkles size={13} />
                  <span>#{featuredIndex + 1} Trending in Vault</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-xs font-medium text-[#8FAE9B]">
                  {featuredBook.category}
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-yellow-500/20 text-xs font-bold text-[#F7D373]">
                  <Star size={13} className="fill-yellow-400 text-yellow-400" />
                  <span>{featuredBook.averageRating?.toFixed(1) || '4.9'}</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold text-[#F7F4EB] tracking-tight leading-tight drop-shadow-md">
                {featuredBook.title}
              </h1>

              <p className="text-sm sm:text-base font-medium text-[#C8A96A] tracking-wide">
                By {featuredBook.author}
              </p>

              <p className="text-xs sm:text-sm text-[#CCCCCC] line-clamp-3 leading-relaxed max-w-xl">
                {featuredBook.description || 'Dive into this celebrated volume. Highlight passages with AI smart-tagging and analyze concepts in real-time.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setSelectedBookForView(featuredBook)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C8A96A] to-[#B59659] hover:brightness-110 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xl transition-all cursor-pointer transform hover:-translate-y-0.5"
                >
                  <BookOpen size={17} />
                  <span>Read Book</span>
                </button>

                <button
                  onClick={() => setSelectedBookForView(featuredBook)}
                  className="flex items-center gap-2 px-5 py-3 bg-[#242424]/80 hover:bg-[#303030] border border-white/15 text-[#F7F4EB] font-medium text-xs sm:text-sm rounded-xl backdrop-blur-md transition-all cursor-pointer"
                >
                  <Sparkles size={16} className="text-[#C8A96A]" />
                  <span>AI Tutor Overview</span>
                </button>

                {/* Edit Button for Featured Book (Admin or Owner) */}
                {(isAdmin || (currentUser && featuredBook.uploadedBy && String(currentUser._id || currentUser.id) === String(featuredBook.uploadedBy._id || featuredBook.uploadedBy))) && (
                  <button
                    onClick={() => handleOpenEdit(featuredBook)}
                    className="flex items-center gap-1.5 px-4 py-3 bg-[#202020] hover:bg-[#C8A96A] border border-[#C8A96A]/50 text-[#C8A96A] hover:text-black font-semibold text-xs rounded-xl backdrop-blur-md transition-all cursor-pointer shadow-md"
                    title="Edit this Book"
                  >
                    <Pencil size={15} />
                    <span>Edit Book</span>
                  </button>
                )}
              </div>
            </div>

            {/* Slide Indicator Dots (Bottom Right) */}
            {heroBooks.length > 1 && (
              <div className="absolute right-6 sm:right-10 bottom-6 z-20 flex items-center gap-2">
                {heroBooks.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFeaturedIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === featuredIndex
                        ? 'w-8 bg-[#C8A96A] shadow-lg shadow-[#C8A96A]/40'
                        : 'w-2 bg-white/30 hover:bg-white/60'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. NETFLIX ROW: "🔥 TRENDING NOW IN PUBLIC VAULT" */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-400">
                <Flame size={20} />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#F7F4EB]">
                Trending in Public Vault
              </h2>
            </div>

            {/* Scroll Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollCarousel('left', carouselRef)}
                className="p-2 rounded-xl bg-[#202020] border border-[#333333] hover:border-[#C8A96A] text-[#A0A0A0] hover:text-[#F7F4EB] transition-all cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scrollCarousel('right', carouselRef)}
                className="p-2 rounded-xl bg-[#202020] border border-[#333333] hover:border-[#C8A96A] text-[#A0A0A0] hover:text-[#F7F4EB] transition-all cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Horizontal Carousel */}
          <div
            ref={carouselRef}
            className="flex items-stretch gap-5 overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {trendingBooks.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                isAdmin={isAdmin}
                currentUser={currentUser}
                onSelectBook={(selected) => setSelectedBookForView(selected)}
                onEditBook={(selected) => handleOpenEdit(selected)}
              />
            ))}
          </div>
        </section>

        {/* 3. MY PERSONAL BOOKSHELF & PRIVATE VAULT */}
        <section className="space-y-4 pt-4 border-t border-[#292929]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                <BookMarked size={20} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#F7F4EB] flex items-center gap-2">
                  <span>My Bookshelf & Private Vault</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#202020] text-[#A0A0A0] font-sans font-medium border border-[#333333]">
                    {myBooks.length} {myBooks.length === 1 ? 'book' : 'books'}
                  </span>
                </h2>
                <p className="text-xs text-[#A0A0A0] mt-0.5">
                  Your private uploads and published books. Click "Edit" on any private book to toggle it to Public!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202020] hover:bg-[#C8A96A] text-[#C8A96A] hover:text-black border border-[#C8A96A]/40 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                <Plus size={14} />
                <span>Upload New Book</span>
              </button>

              {myBooks.length > 0 && (
                <>
                  <button
                    onClick={() => scrollCarousel('left', myBooksCarouselRef)}
                    className="p-2 rounded-xl bg-[#202020] border border-[#333333] hover:border-[#C8A96A] text-[#A0A0A0] hover:text-[#F7F4EB] transition-all cursor-pointer"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scrollCarousel('right', myBooksCarouselRef)}
                    className="p-2 rounded-xl bg-[#202020] border border-[#333333] hover:border-[#C8A96A] text-[#A0A0A0] hover:text-[#F7F4EB] transition-all cursor-pointer"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          {myBooks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[#333333] bg-[#1a1a1a]/60">
              <BookOpen size={28} className="mx-auto text-[#777777] mb-2" />
              <p className="text-sm font-medium text-[#F7F4EB]">Your personal bookshelf is currently empty</p>
              <p className="text-xs text-[#888888] mt-1 max-w-md mx-auto">
                Upload your reading material. You can choose whether to keep it private in your vault or publish it to the public library.
              </p>
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#C8A96A] to-[#B59659] text-white text-xs font-semibold rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Upload a Book Now</span>
              </button>
            </div>
          ) : (
            <div
              ref={myBooksCarouselRef}
              className="flex items-stretch gap-5 overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {myBooks.map((book) => (
                <BookCard
                  key={book._id}
                  book={book}
                  isAdmin={isAdmin}
                  currentUser={currentUser}
                  onSelectBook={(selected) => setSelectedBookForView(selected)}
                  onEditBook={(selected) => handleOpenEdit(selected)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 4. CATEGORY EXPLORER & SEARCH SECTION */}
        <section className="space-y-6 pt-4 border-t border-[#292929]">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#F7F4EB]">
                Explore Library by Category
              </h2>
              <p className="text-xs text-[#A0A0A0] mt-0.5">
                Filter public books by philosophy, productivity, science, or your own custom genres.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title or author..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1c1c1c] border border-[#333333] text-xs text-[#F7F4EB] placeholder-[#666666] focus:outline-none focus:border-[#C8A96A] transition-colors"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <div key={cat} className="flex items-center shrink-0">
                  <button
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C8A96A] text-black shadow-lg shadow-[#C8A96A]/20'
                        : 'bg-[#202020] border border-[#333333] text-[#A0A0A0] hover:text-[#F7F4EB] hover:bg-[#282828]'
                    }`}
                  >
                    <span>{cat}</span>

                    {/* Admin Delete Category (x) Icon */}
                    {isAdmin && cat !== 'All' && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat);
                        }}
                        className={`ml-1 -mr-1 p-0.5 rounded-md transition-colors cursor-pointer ${
                          isSelected
                            ? 'text-black/60 hover:text-red-700 hover:bg-black/15'
                            : 'text-[#666666] hover:text-red-400 hover:bg-red-500/15'
                        }`}
                        title={`Delete "${cat}" category`}
                      >
                        <X size={12} />
                      </span>
                    )}
                  </button>
                </div>
              );
            })}

            {/* Only Admins can add custom categories */}
            {isAdmin && (
              <button
                onClick={() => setIsAddCategoryModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-dashed border-[#C8A96A]/50 text-[#C8A96A] hover:bg-[#C8A96A]/15 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-sm shrink-0"
                title="Add a new custom category (Admin only)"
              >
                <Plus size={14} />
                <span>Add Category</span>
              </button>
            )}
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                isAdmin={isAdmin}
                currentUser={currentUser}
                onSelectBook={(selected) => setSelectedBookForView(selected)}
                onEditBook={(selected) => handleOpenEdit(selected)}
              />
            ))}
          </div>

          {filteredBooks.length === 0 && (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#333333] bg-[#1c1c1c]/50">
              <Compass size={32} className="mx-auto text-[#777777] mb-2" />
              <p className="text-sm font-medium text-[#A0A0A0]">No books found in "{selectedCategory}".</p>
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#252525] hover:bg-[#C8A96A] text-[#C8A96A] hover:text-black border border-[#C8A96A]/30 text-xs font-semibold transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Upload a book to {selectedCategory}</span>
              </button>
            </div>
          )}

        </section>

        {/* 5. PERSONAL READING STATS */}
        <section className="pt-8 border-t border-[#292929] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass size={20} className="text-[#C8A96A]" />
              <h2 className="text-xl font-serif font-bold text-[#F7F4EB]">
                My Personal Reading Stats
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#1c1c1c] border border-[#2d2d2d] flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#8FAE9B]/15 text-[#8FAE9B]">
                <BookOpen size={20} />
              </div>
              <div>
                <p className="text-xs text-[#A0A0A0] uppercase tracking-wider font-semibold">Public Books Available</p>
                <p className="text-xl font-bold text-[#F7F4EB]">{trendingBooks.length}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#1c1c1c] border border-[#2d2d2d] flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#C8A96A]/15 text-[#C8A96A]">
                <BookMarked size={20} />
              </div>
              <div>
                <p className="text-xs text-[#A0A0A0] uppercase tracking-wider font-semibold">My Uploaded Books</p>
                <p className="text-xl font-bold text-[#F7F4EB]">{myBooks.length}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#1c1c1c] border border-[#2d2d2d] flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-500/15 text-indigo-400">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs text-[#A0A0A0] uppercase tracking-wider font-semibold">Reading Streak</p>
                <p className="text-xl font-bold text-[#F7F4EB]">Active (1 Day)</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ==================== CREATE CATEGORY MODAL (ADMIN ONLY) ==================== */}
      {isAdmin && isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#202020] border border-[#333333] rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#C8A96A]/20 text-[#C8A96A]">
                  <FolderPlus size={18} />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#F7F4EB]">
                  Add New Book Category
                </h3>
              </div>
              <button
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="p-1.5 text-[#A0A0A0] hover:text-[#F7F4EB] hover:bg-[#282828] rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder="e.g. Psychology, Economics, Sci-Fi..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#181818] border border-[#333333] text-sm text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A] transition-colors"
                  autoFocus
                />
                <p className="text-[11px] text-[#777777] mt-1.5">
                  This category will immediately appear in your filter bar and in book upload/edit dropdowns.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#333333]">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#333333] text-xs font-semibold text-[#A0A0A0] hover:text-[#F7F4EB] hover:bg-[#282828] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#C8A96A] to-[#B59659] hover:brightness-110 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Create Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== BOOK DETAIL MODAL ==================== */}
      {selectedBookForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#1e1e1e] border border-[#333333] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            
            {/* Book Cover */}
            <div className="w-full sm:w-48 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img
                src={selectedBookForView.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'}
                alt={selectedBookForView.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Book Info & Action */}
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#8FAE9B]/15 text-[#8FAE9B] text-xs font-semibold uppercase tracking-wider">
                      {selectedBookForView.category || 'General'}
                    </span>
                    {selectedBookForView.isPublic === false ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                        <Lock size={12} />
                        <span>Private Vault</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#C8A96A]/15 text-[#C8A96A] text-xs font-semibold border border-[#C8A96A]/30">
                        <Globe size={12} />
                        <span>Public Feed</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedBookForView(null)}
                    className="text-[#A0A0A0] hover:text-[#F7F4EB] text-xs p-1 cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                <h3 className="font-serif text-2xl font-bold text-[#F7F4EB]">
                  {selectedBookForView.title}
                </h3>
                <p className="text-sm font-medium text-[#C8A96A] mt-1">
                  By {selectedBookForView.author}
                </p>

                <div className="flex items-center gap-2 mt-2 text-xs text-[#F7D373]">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">{selectedBookForView.averageRating?.toFixed(1) || '4.8'}</span>
                  <span className="text-[#888888]">({selectedBookForView.totalRatings || '1.2k'} reviews)</span>
                </div>

                <p className="text-xs text-[#A0A0A0] leading-relaxed mt-4">
                  {selectedBookForView.description || 'Full book available for AI reading, live semantic highlighting, and interactive study tutoring.'}
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-[#2e2e2e]">
                <button
                  onClick={() => {
                    alert(`Starting reader for "${selectedBookForView.title}"! Reader canvas is ready for integration.`);
                    setSelectedBookForView(null);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#C8A96A] to-[#B59659] hover:brightness-110 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <BookOpen size={16} />
                  <span>Start Reading with AI Tutor</span>
                </button>

                {canEditSelectedBook && (
                  <button
                    onClick={() => {
                      const book = selectedBookForView;
                      setSelectedBookForView(null);
                      handleOpenEdit(book);
                    }}
                    className="w-full py-2.5 bg-[#252525] hover:bg-[#C8A96A] text-[#C8A96A] hover:text-black border border-[#C8A96A]/40 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Pencil size={14} />
                    <span>Edit Book Details / Change Visibility</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedBookForView(null)}
                  className="w-full py-2 text-[#A0A0A0] hover:text-[#F7F4EB] text-xs font-medium transition-all cursor-pointer"
                >
                  Back to Library
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================== UNIVERSAL BOOK UPLOAD MODAL ==================== */}
      <AdminUploadModal
        isOpen={isAdminModalOpen}
        isAdmin={isAdmin}
        availableCategories={allCategories}
        onClose={() => setIsAdminModalOpen(false)}
        onBookUploaded={(newBook, newCat) => {
          setMyBooks((prev) => [newBook, ...prev]);
          if (newBook.isPublic) {
            setTrendingBooks((prev) => [newBook, ...prev]);
          }
          if (newCat) {
            if (removedCategories.includes(newCat)) {
              const unRemoved = removedCategories.filter((c) => c !== newCat);
              setRemovedCategories(unRemoved);
              localStorage.setItem('removed_categories', JSON.stringify(unRemoved));
            }
            if (!allCategories.includes(newCat)) {
              const updated = Array.from(new Set([...customCategories, newCat]));
              setCustomCategories(updated);
              localStorage.setItem('custom_categories', JSON.stringify(updated));
            }
          }
        }}
      />

      {/* ==================== UNIVERSAL EDIT BOOK MODAL ==================== */}
      <EditBookModal
        book={bookToEdit}
        isAdmin={isAdmin}
        availableCategories={allCategories}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onBookUpdated={handleBookUpdated}
        onBookDeleted={handleBookDeleted}
      />

      {/* ==================== FOOTER ==================== */}
      <footer className="p-4 text-center text-xs text-[#555555] border-t border-[#222222] mt-12">
        © 2026 Gregarious Closet. Public Library Feed & AI Reading Tutor.
      </footer>
    </div>
  );
}
