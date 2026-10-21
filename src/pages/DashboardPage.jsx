import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, LogOut, Plus, Sparkles, BookMarked, Compass, Clock, User } from 'lucide-react';
import logo from '../assets/logo.png';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

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
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-[#181818] text-[#F7F4EB] font-sans flex flex-col">
      {/* TOP NAVIGATION BAR */}
      <header className="border-b border-[#333333] bg-[#202020]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-9 h-9 object-contain" />
            <span className="font-serif font-bold text-lg tracking-wide text-[#F7F4EB]">
              Gregarious<span className="text-[#C8A96A] italic">Closet</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181818] border border-[#333333]">
              <div className="w-7 h-7 rounded-full bg-[#8FAE9B]/20 text-[#8FAE9B] flex items-center justify-center font-bold text-xs uppercase">
                {currentUser?.name ? currentUser.name[0] : <User size={14} />}
              </div>
              <span className="text-xs font-medium text-[#F7F4EB] pr-1">
                {currentUser?.name || 'Reader'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-[#A0A0A0] hover:text-[#F7F4EB] px-3 py-1.5 rounded-lg border border-transparent hover:border-[#333333] hover:bg-[#181818] transition-all cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* WELCOME BANNER */}
        <div className="rounded-2xl border border-[#333333] bg-gradient-to-r from-[#202020] via-[#24221E] to-[#202020] p-6 lg:p-8 mb-8 relative overflow-hidden shadow-lg">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8A96A]/15 text-[#C8A96A] text-xs font-semibold mb-3">
              <Sparkles size={14} />
              <span>AI Reading Companion Active</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold mb-2">
              Welcome back, <span className="text-[#C8A96A]">{currentUser?.name || 'Reader'}</span>
            </h1>
            <p className="text-sm text-[#A0A0A0] leading-relaxed">
              Your personal library and AI study tutor are ready. Highlight passages, generate chapter summaries, and deep dive into your reading.
            </p>
          </div>
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-56 w-56 rounded-full bg-[#C8A96A]/10 blur-3xl" />
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-[#202020] border border-[#333333] flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#8FAE9B]/15 text-[#8FAE9B]">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-xs text-[#A0A0A0] uppercase tracking-wider font-semibold">Books in Shelf</p>
              <p className="text-xl font-bold text-[#F7F4EB]">0</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#202020] border border-[#333333] flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#C8A96A]/15 text-[#C8A96A]">
              <BookMarked size={20} />
            </div>
            <div>
              <p className="text-xs text-[#A0A0A0] uppercase tracking-wider font-semibold">AI Annotations</p>
              <p className="text-xl font-bold text-[#F7F4EB]">0</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#202020] border border-[#333333] flex items-center gap-4">
            <div className="p-3 rounded-lg bg-indigo-500/15 text-indigo-400">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-[#A0A0A0] uppercase tracking-wider font-semibold">Reading Streak</p>
              <p className="text-xl font-bold text-[#F7F4EB]">1 Day</p>
            </div>
          </div>
        </div>

        {/* MY BOOKSHELF SECTION */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-bold text-[#F7F4EB] flex items-center gap-2">
            <Compass size={18} className="text-[#C8A96A]" />
            <span>My Bookshelf</span>
          </h2>

          <button className="flex items-center gap-2 px-4 py-2 bg-[#8FAE9B] hover:bg-[#7D9D8A] text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer">
            <Plus size={16} />
            <span>Add Book</span>
          </button>
        </div>

        {/* EMPTY BOOKSHELF STATE */}
        <div className="rounded-2xl border border-dashed border-[#333333] bg-[#202020]/40 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#181818] border border-[#333333] flex items-center justify-center text-[#A0A0A0] mb-4">
            <BookOpen size={24} />
          </div>
          <h3 className="text-base font-semibold text-[#F7F4EB] mb-1">Your bookshelf is empty</h3>
          <p className="text-xs text-[#A0A0A0] max-w-sm mb-4">
            Add your first book, article, or PDF to start reading with your AI reading companion.
          </p>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#202020] hover:bg-[#282828] border border-[#333333] text-xs font-semibold rounded-xl transition-all text-[#F7F4EB] cursor-pointer">
            <Plus size={14} className="text-[#8FAE9B]" />
            <span>Explore Sample Books</span>
          </button>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="p-4 text-center text-xs text-[#555555] border-t border-[#252525]">
        © 2026 Gregarious Closet. All rights reserved.
      </footer>
    </div>
  );
}

