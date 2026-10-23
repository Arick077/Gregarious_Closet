import React, { useState } from 'react';
import { X, Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle, Sparkles, Globe, Lock } from 'lucide-react';

export default function BookUploadModal({ isOpen, onClose, onBookUploaded, availableCategories = [], isAdmin = false }) {
  const defaultCategories = ['Philosophy', 'Productivity', 'History', 'Technology', 'Science', 'Fiction', 'General'];
  const allCategories = Array.from(new Set([...defaultCategories, ...availableCategories]));

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: allCategories[0] || 'General',
    averageRating: 4.8,
    isPublic: isAdmin ? true : false // Admins default to public, regular users default to private
  });
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [bookFile, setBookFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'category' && value === '__NEW__' && isAdmin) {
      setIsCustomCategory(true);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBookFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'epub'].includes(ext)) {
        setError('Book file must be a PDF or EPUB document.');
        setBookFile(null);
        return;
      }
      setError('');
      setBookFile(file);
    }
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        setError('Cover image must be a JPG, PNG, or WEBP image.');
        setCoverFile(null);
        setCoverPreview(null);
        return;
      }
      setError('');
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('Book title is required.');
      return;
    }

    if (!bookFile) {
      setError('Please select a book file (PDF or EPUB).');
      return;
    }

    // Regular users MUST choose an existing category. Only admins can use a custom category.
    const finalCategory = (isAdmin && isCustomCategory ? customCategory.trim() : formData.category) || 'General';

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('author', formData.author.trim() || 'Unknown');
      data.append('description', formData.description.trim());
      data.append('category', finalCategory);
      data.append('averageRating', formData.averageRating);
      data.append('isPublic', formData.isPublic);
      data.append('book', bookFile);
      if (coverFile) {
        data.append('coverImage', coverFile);
      }

      const response = await fetch('/api/books/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Failed to upload book.');
      }

      setSuccess(formData.isPublic 
        ? 'Book published to the public library feed!' 
        : 'Book saved privately to your personal vault!'
      );

      setTimeout(() => {
        if (onBookUploaded) onBookUploaded(resData.book, finalCategory);
        onClose();
      }, 1000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Error uploading book.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#202020] border border-[#333333] rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#333333]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#C8A96A]/20 text-[#C8A96A]">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#F7F4EB]">
                {isAdmin ? 'Publish / Upload Book' : 'Add Book to Library'}
              </h3>
              <p className="text-xs text-[#A0A0A0]">
                Upload your reading material. You can choose whether to keep it private or make it public.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#A0A0A0] hover:text-[#F7F4EB] hover:bg-[#282828] rounded-xl transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          
          {/* VISIBILITY SELECTOR: PUBLIC VS PRIVATE */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-2">
              Book Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, isPublic: false }))}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  !formData.isPublic
                    ? 'border-[#8FAE9B] bg-[#8FAE9B]/10 text-[#F7F4EB]'
                    : 'border-[#333333] bg-[#181818] text-[#888888] hover:border-[#444444]'
                }`}
              >
                <div className={`p-2 rounded-xl ${!formData.isPublic ? 'bg-[#8FAE9B]/20 text-[#8FAE9B]' : 'bg-[#222222] text-[#666666]'}`}>
                  <Lock size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#F7F4EB]">Keep Private</div>
                  <div className="text-[10px] text-[#A0A0A0] leading-tight mt-0.5">
                    Only you can see and read this book in your private vault.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, isPublic: true }))}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.isPublic
                    ? 'border-[#C8A96A] bg-[#C8A96A]/10 text-[#F7F4EB]'
                    : 'border-[#333333] bg-[#181818] text-[#888888] hover:border-[#444444]'
                }`}
              >
                <div className={`p-2 rounded-xl ${formData.isPublic ? 'bg-[#C8A96A]/20 text-[#C8A96A]' : 'bg-[#222222] text-[#666666]'}`}>
                  <Globe size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#F7F4EB]">Make Public</div>
                  <div className="text-[10px] text-[#A0A0A0] leading-tight mt-0.5">
                    Published to the shared public library feed for everyone.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Title & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5">
                Book Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Meditations"
                className="w-full px-4 py-2.5 rounded-xl bg-[#181818] border border-[#333333] text-sm text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5">
                Author
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="e.g. Marcus Aurelius"
                className="w-full px-4 py-2.5 rounded-xl bg-[#181818] border border-[#333333] text-sm text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A] transition-colors"
              />
            </div>
          </div>

          {/* Category & Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">
                  Category
                </label>
                {/* Only Admins can add custom categories */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-[11px] text-[#C8A96A] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {isCustomCategory ? 'Choose from list' : '+ Add New Category'}
                  </button>
                )}
              </div>

              {isAdmin && isCustomCategory ? (
                <div className="relative">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Type new category (Admin only)"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#181818] border border-[#C8A96A] text-sm text-[#F7F4EB] focus:outline-none focus:ring-1 focus:ring-[#C8A96A] transition-colors"
                    autoFocus
                  />
                </div>
              ) : (
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#181818] border border-[#333333] text-sm text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A] transition-colors cursor-pointer"
                >
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  {isAdmin && <option value="__NEW__">+ Custom Category...</option>}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5">
                Rating (0.0 - 5.0)
              </label>
              <input
                type="number"
                name="averageRating"
                min="1.0"
                max="5.0"
                step="0.1"
                value={formData.averageRating}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-[#181818] border border-[#333333] text-sm text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A] transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5">
              Synopsis / Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief summary of the book content and key takeaways..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#181818] border border-[#333333] text-sm text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A] transition-colors resize-none"
            />
          </div>

          {/* File Uploads Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Book File (PDF/EPUB) */}
            <div className="p-4 rounded-2xl bg-[#181818] border border-dashed border-[#333333] hover:border-[#8FAE9B] transition-colors flex flex-col items-center justify-center text-center">
              <FileText size={28} className="text-[#8FAE9B] mb-2" />
              <label className="text-xs font-semibold text-[#F7F4EB] cursor-pointer hover:underline">
                <span>{bookFile ? bookFile.name : 'Select Book (PDF / EPUB) *'}</span>
                <input
                  type="file"
                  accept=".pdf,.epub"
                  onChange={handleBookFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-[#A0A0A0] mt-1">Up to 50MB</span>
            </div>

            {/* Cover Image */}
            <div className="p-4 rounded-2xl bg-[#181818] border border-dashed border-[#333333] hover:border-[#C8A96A] transition-colors flex flex-col items-center justify-center text-center">
              {coverPreview ? (
                <div className="relative mb-1">
                  <img src={coverPreview} alt="Cover Preview" className="w-14 h-20 object-cover rounded shadow" />
                </div>
              ) : (
                <ImageIcon size={28} className="text-[#C8A96A] mb-2" />
              )}
              <label className="text-xs font-semibold text-[#F7F4EB] cursor-pointer hover:underline">
                <span>{coverFile ? coverFile.name : 'Upload Cover Image'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleCoverFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-[#A0A0A0] mt-1">JPG, PNG, WEBP</span>
            </div>

          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#333333]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl border border-[#333333] text-xs font-semibold text-[#A0A0A0] hover:text-[#F7F4EB] hover:bg-[#282828] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#C8A96A] to-[#B59659] hover:brightness-110 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload size={16} />
              <span>
                {isLoading 
                  ? 'Saving...' 
                  : formData.isPublic 
                    ? 'Publish to Public Feed' 
                    : 'Save to Private Vault'
                }
              </span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
