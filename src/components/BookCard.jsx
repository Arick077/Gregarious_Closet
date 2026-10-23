import React from 'react';
import { Star, BookOpen, Sparkles, Pencil, Lock, Globe } from 'lucide-react';

export default function BookCard({ book, onSelectBook, isAdmin = false, currentUser = null, onEditBook }) {
  const fallbackCover = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600';
  const cover = book.coverImage || fallbackCover;

  // Determine if the current user owns this book or is an admin
  const currentUserId = currentUser?._id || currentUser?.id;
  const bookOwnerId = book?.uploadedBy?._id || book?.uploadedBy;
  const isOwner = Boolean(currentUserId && bookOwnerId && String(currentUserId) === String(bookOwnerId));
  const canEdit = Boolean(isAdmin || isOwner);

  const isPrivate = book.isPublic === false;

  return (
    <div
      onClick={() => onSelectBook && onSelectBook(book)}
      className="group relative flex-none w-[180px] sm:w-[210px] md:w-[230px] rounded-2xl overflow-hidden bg-[#202020] border border-[#333333] hover:border-[#C8A96A]/60 shadow-md hover:shadow-2xl hover:shadow-[#C8A96A]/10 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer flex flex-col"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#181818]">
        <img
          src={cover}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.src = fallbackCover;
          }}
        />

        {/* Ambient Top & Bottom Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#202020] via-transparent to-black/60 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-semibold text-[#8FAE9B] border border-white/10 uppercase tracking-wider">
              {book.category || 'General'}
            </span>
            {isPrivate && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/30" title="Private to your vault">
                <Lock size={10} />
                <span>Private</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEditBook) onEditBook(book);
                }}
                className="p-1 rounded-md bg-black/70 hover:bg-[#C8A96A] text-[#C8A96A] hover:text-black border border-[#C8A96A]/40 transition-colors shadow-sm"
                title={isAdmin ? "Edit Book (Admin)" : "Edit Your Book / Change Visibility"}
              >
                <Pencil size={11} />
              </button>
            )}

            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-bold text-[#F7D373] border border-yellow-500/20">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              <span>{book.averageRating ? book.averageRating.toFixed(1) : '4.8'}</span>
            </span>
          </div>
        </div>

        {/* Hover Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-4 text-center z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectBook) onSelectBook(book);
            }}
            className="w-full py-2 bg-gradient-to-r from-[#C8A96A] to-[#B59659] text-white text-xs font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
          >
            <BookOpen size={14} />
            <span>Read Now</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectBook) onSelectBook(book);
            }}
            className="w-full py-1.5 bg-[#252525]/90 border border-white/20 text-[#F7F4EB] text-xs font-medium rounded-xl hover:bg-[#303030] transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles size={13} className="text-[#C8A96A]" />
            <span>AI Tutor</span>
          </button>

          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onEditBook) onEditBook(book);
              }}
              className="w-full py-1.5 bg-[#C8A96A]/20 hover:bg-[#C8A96A] border border-[#C8A96A]/50 text-[#C8A96A] hover:text-black text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Pencil size={12} />
              <span>Edit / {isPrivate ? 'Make Public' : 'Edit Book'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Book Metadata Footer */}
      <div className="p-3.5 flex flex-col justify-between flex-1 bg-[#202020]">
        <div>
          <h4 className="font-serif font-bold text-sm text-[#F7F4EB] line-clamp-1 group-hover:text-[#C8A96A] transition-colors">
            {book.title}
          </h4>
          <p className="text-xs text-[#A0A0A0] line-clamp-1 mt-0.5">
            {book.author || 'Unknown Author'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#2e2e2e] text-[11px] text-[#777777]">
          {isPrivate ? (
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <Lock size={11} />
              <span>Private Vault</span>
            </span>
          ) : (
            <span className="uppercase tracking-wider font-semibold text-[#8FAE9B] flex items-center gap-1">
              <Globe size={11} />
              <span>Public Feed</span>
            </span>
          )}
          <span>{book.views ? `${book.views} reads` : 'New'}</span>
        </div>
      </div>
    </div>
  );
}
