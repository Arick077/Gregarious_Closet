import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Calendar, Target, Layers, 
  CheckCircle2, Sparkles, Bookmark, Pencil, 
  Clock, ListFilter, AlertCircle, ChevronRight, ArrowLeft
} from 'lucide-react';

// Cascading category and sub-category mapping (Requirement #6)
const CASCADING_CATEGORIES = {
  'Literature & Fiction': [
    'Classic Literature',
    'Sci-Fi & Fantasy',
    'Mystery & Thriller',
    'Philosophy'
  ],
  'Technology & CS': [
    'Web Engineering',
    'Artificial Intelligence',
    'Cybersecurity',
    'Cloud Computing'
  ],
  'Science & Nature': [
    'Quantum Physics',
    'Genetics & Biology',
    'Astronomy',
    'Neuroscience'
  ],
  'Business & Economics': [
    'Product Management',
    'Venture Capital',
    'Behavioral Economics',
    'Finance'
  ]
};

const MASTERY_LEVELS = [
  'Beginner / Casual',
  'Undergraduate Study',
  'Advanced / Research'
];

export default function ReadingRoadmapModal({ 
  isOpen, 
  onClose, 
  initialTab = 'list', // 'list' | 'form'
  onRoadmapsChanged 
}) {
  const categories = Object.keys(CASCADING_CATEGORIES);
  const initialCategory = categories[0];

  // Persistent Roadmaps List State
  const [roadmaps, setRoadmaps] = useState(() => {
    try {
      const saved = localStorage.getItem('saved_roadmaps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active View Tab: 'list' (View existing) | 'form' (Create / Edit)
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingRoadmapId, setEditingRoadmapId] = useState(null);

  // Form Fields State (Requirement #6 & #14)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState(CASCADING_CATEGORIES[initialCategory][0]);
  const [masteryLevel, setMasteryLevel] = useState(MASTERY_LEVELS[1]);
  const [roadmapTitle, setRoadmapTitle] = useState('');
  const [milestones, setMilestones] = useState([
    'Read foundational chapters & annotate key thesis statements',
    'Synthesize core insights with AI Tutor & complete review exercises'
  ]);
  const [targetDate, setTargetDate] = useState('');

  // UI / Feedback States
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  const todayIso = new Date().toISOString().split('T')[0];

  // Sync state when modal opens or initialTab changes
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('saved_roadmaps');
        const parsed = saved ? JSON.parse(saved) : [];
        setRoadmaps(parsed);
        // If initialTab requested is list and no roadmaps exist, default to form
        if (initialTab === 'list' && parsed.length === 0) {
          setActiveTab('form');
        } else {
          setActiveTab(initialTab);
        }
      } catch {
        setActiveTab(initialTab);
      }
      setEditingRoadmapId(null);
      setError('');
      setSuccessBanner('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Reset form to blank create mode
  const resetFormToDefaults = () => {
    setSelectedCategory(initialCategory);
    setSelectedSubCategory(CASCADING_CATEGORIES[initialCategory][0]);
    setMasteryLevel(MASTERY_LEVELS[1]);
    setRoadmapTitle('');
    setMilestones([
      'Read foundational chapters & annotate key thesis statements',
      'Synthesize core insights with AI Tutor & complete review exercises'
    ]);
    setTargetDate('');
    setEditingRoadmapId(null);
    setError('');
  };

  // Switch to Create Mode
  const handleStartCreate = () => {
    resetFormToDefaults();
    setActiveTab('form');
    setSuccessBanner('');
  };

  // Switch to Edit Mode with an existing roadmap pre-filled
  const handleStartEdit = (roadmap) => {
    setEditingRoadmapId(roadmap.id);
    setRoadmapTitle(roadmap.title || '');
    setSelectedCategory(roadmap.category || initialCategory);
    setSelectedSubCategory(roadmap.subCategory || CASCADING_CATEGORIES[roadmap.category || initialCategory][0]);
    setMasteryLevel(roadmap.masteryLevel || MASTERY_LEVELS[1]);
    setMilestones(roadmap.milestones && roadmap.milestones.length > 0 ? [...roadmap.milestones] : ['']);
    setTargetDate(roadmap.targetDate || '');
    setError('');
    setSuccessBanner('');
    setActiveTab('form');
  };

  // Delete an existing roadmap
  const handleDeleteRoadmap = (idToDelete) => {
    const roadmapToDelete = roadmaps.find((r) => r.id === idToDelete);
    const confirmed = window.confirm(
      `Are you sure you want to delete the roadmap "${roadmapToDelete?.title || 'Selected Roadmap'}"?`
    );
    if (!confirmed) return;

    const updated = roadmaps.filter((r) => r.id !== idToDelete);
    setRoadmaps(updated);
    try {
      localStorage.setItem('saved_roadmaps', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    if (onRoadmapsChanged) {
      onRoadmapsChanged(updated);
    }

    setSuccessBanner('Roadmap deleted successfully.');
    setTimeout(() => setSuccessBanner(''), 2500);
  };

  // Cascading Category Handler: when category changes, reset sub-category automatically
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    const subCategories = CASCADING_CATEGORIES[newCategory] || [];
    setSelectedSubCategory(subCategories[0] || '');
  };

  // Dynamic Textbox Handlers (Requirement #6)
  const handleAddMilestone = () => {
    setMilestones((prev) => [...prev, '']);
  };

  const handleMilestoneChange = (index, value) => {
    setMilestones((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleRemoveMilestone = (indexToRemove) => {
    if (milestones.length <= 1) {
      setError('You must keep at least 1 reading milestone in your roadmap.');
      return;
    }
    setError('');
    setMilestones((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Form Submission (Create OR Edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedTitle = roadmapTitle.trim() || `${selectedSubCategory} Mastery Plan`;
    const cleanedMilestones = milestones.map((m) => m.trim()).filter(Boolean);

    if (cleanedMilestones.length === 0) {
      setError('Please add at least one milestone for your reading plan.');
      return;
    }

    if (!targetDate) {
      setError('Please select a target completion date.');
      return;
    }

    let updatedList = [];

    if (editingRoadmapId) {
      // EDIT EXISTING ROADMAP
      updatedList = roadmaps.map((r) => {
        if (r.id === editingRoadmapId) {
          return {
            ...r,
            title: trimmedTitle,
            category: selectedCategory,
            subCategory: selectedSubCategory,
            masteryLevel,
            milestones: cleanedMilestones,
            targetDate,
            updatedAt: new Date().toISOString()
          };
        }
        return r;
      });
      setSuccessBanner(`Roadmap "${trimmedTitle}" updated successfully!`);
    } else {
      // CREATE NEW ROADMAP
      const newRoadmap = {
        id: Date.now().toString(),
        title: trimmedTitle,
        category: selectedCategory,
        subCategory: selectedSubCategory,
        masteryLevel,
        milestones: cleanedMilestones,
        targetDate,
        createdAt: new Date().toISOString()
      };
      updatedList = [newRoadmap, ...roadmaps];
      setSuccessBanner(`Roadmap "${trimmedTitle}" activated!`);
    }

    setRoadmaps(updatedList);
    try {
      localStorage.setItem('saved_roadmaps', JSON.stringify(updatedList));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    if (onRoadmapsChanged) {
      onRoadmapsChanged(updatedList);
    }

    // Return to the list view after saving
    setActiveTab('list');
    setEditingRoadmapId(null);
    setTimeout(() => setSuccessBanner(''), 3000);
  };

  // Format date preview
  const formatDatePreview = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Calculate days remaining or overdue
  const getDaysStatus = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    if (diffDays === 0) return { label: 'Due today', isToday: true };
    return { label: `${diffDays} days left`, isUpcoming: true };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#202020] border border-[#333333] rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto selection:bg-[#C8A96A] selection:text-black">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#333333]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#C8A96A]/20 text-[#C8A96A]">
              <Target size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-bold text-[#F7F4EB]">
                  Reading Roadmap Center
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#C8A96A]/15 border border-[#C8A96A]/30 text-[10px] font-bold text-[#C8A96A] uppercase">
                  Req #6 & #14
                </span>
              </div>
              <p className="text-xs text-[#A0A0A0]">
                Manage, edit, and track your structured reading milestones and target dates.
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

        {/* Top Tab Bar: Existing Roadmaps vs Create/Edit */}
        <div className="flex items-center justify-between gap-3 mt-4 pb-2">
          <div className="flex bg-[#181818] p-1 rounded-2xl border border-[#333333] w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab('list');
                setEditingRoadmapId(null);
                setError('');
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-[#C8A96A] text-black shadow-md'
                  : 'text-[#A0A0A0] hover:text-[#F7F4EB]'
              }`}
            >
              <ListFilter size={14} />
              <span>Existing Roadmaps</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'list' ? 'bg-black/20 text-black' : 'bg-[#252525] text-[#C8A96A]'
              }`}>
                {roadmaps.length}
              </span>
            </button>

            <button
              type="button"
              onClick={handleStartCreate}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'form' && !editingRoadmapId
                  ? 'bg-[#C8A96A] text-black shadow-md'
                  : editingRoadmapId
                  ? 'bg-[#C8A96A]/20 text-[#C8A96A] border border-[#C8A96A]/40'
                  : 'text-[#A0A0A0] hover:text-[#F7F4EB]'
              }`}
            >
              {editingRoadmapId ? (
                <>
                  <Pencil size={14} />
                  <span>Editing Roadmap</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Create New</span>
                </>
              )}
            </button>
          </div>

          {activeTab === 'list' && (
            <button
              type="button"
              onClick={handleStartCreate}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C8A96A] to-[#B59659] text-white text-xs font-semibold shadow hover:brightness-110 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Create New Roadmap</span>
            </button>
          )}
        </div>

        {/* Global Feedback Banner */}
        {successBanner && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-3 p-3 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 1: EXISTING ROADMAPS LIST WITH EDIT/DELETE ACTIONS              */}
        {/* ==================================================================== */}
        {activeTab === 'list' && (
          <div className="mt-4 space-y-4 animate-fadeIn">
            {roadmaps.length === 0 ? (
              <div className="p-10 text-center rounded-3xl border border-dashed border-[#333333] bg-[#1a1a1a]/70 space-y-3">
                <Target size={36} className="mx-auto text-[#666666]" />
                <h4 className="font-serif text-lg font-bold text-[#F7F4EB]">
                  No Reading Roadmaps Created Yet
                </h4>
                <p className="text-xs text-[#888888] max-w-md mx-auto leading-relaxed">
                  Design structured reading milestones with cascading subjects and target completion dates to stay on track.
                </p>
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#C8A96A] to-[#B59659] text-white text-xs font-semibold rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create Your First Roadmap</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {roadmaps.map((item) => {
                  const daysStatus = getDaysStatus(item.targetDate);
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#2e2e2e] hover:border-[#C8A96A]/60 shadow-lg transition-all space-y-3.5 group"
                    >
                      {/* Top Header of Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#2b2b2b]">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-[#8FAE9B]/15 text-[#8FAE9B] text-[11px] font-semibold border border-[#8FAE9B]/30">
                              {item.category}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-[#C8A96A]/15 text-[#C8A96A] text-[11px] font-semibold border border-[#C8A96A]/30">
                              {item.subCategory}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-[#252525] text-[#A0A0A0] text-[10px] font-medium">
                              {item.masteryLevel}
                            </span>
                          </div>

                          <h4 className="font-serif text-lg font-bold text-[#F7F4EB] pt-1">
                            {item.title}
                          </h4>
                        </div>

                        {/* Date Status & Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {daysStatus && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border ${
                              daysStatus.isOverdue
                                ? 'bg-red-950/70 border-red-500/30 text-red-400'
                                : 'bg-[#C8A96A]/10 border-[#C8A96A]/30 text-[#C8A96A]'
                            }`}>
                              <Clock size={12} />
                              <span>{daysStatus.label}</span>
                            </span>
                          )}

                          {/* EDIT ROADMAP BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#252525] hover:bg-[#C8A96A] text-[#C8A96A] hover:text-black border border-[#C8A96A]/40 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                            title="Edit this roadmap"
                          >
                            <Pencil size={13} />
                            <span>Edit</span>
                          </button>

                          {/* DELETE ROADMAP BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleDeleteRoadmap(item.id)}
                            className="p-1.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/15 transition-all cursor-pointer"
                            title="Delete this roadmap"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Milestones Preview List */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#A0A0A0]">
                          <span className="flex items-center gap-1.5">
                            <Bookmark size={13} className="text-[#8FAE9B]" />
                            <span>Milestones ({item.milestones?.length || 0})</span>
                          </span>
                          <span className="text-[11px] text-[#777777]">
                            Target: {formatDatePreview(item.targetDate)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {item.milestones?.map((milestone, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-2.5 rounded-xl bg-[#141414] border border-[#262626] text-xs text-[#D8D8D8]"
                            >
                              <span className="w-4 h-4 rounded-full bg-[#C8A96A]/20 text-[#C8A96A] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="line-clamp-2 leading-relaxed">{milestone}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 2: CREATE / EDIT ROADMAP FORM WITH CASCADING & DYNAMIC INPUTS   */}
        {/* ==================================================================== */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5 animate-fadeIn">
            
            {/* Form Mode Indicator */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1a1a1a] border border-[#2e2e2e]">
              <div className="flex items-center gap-2 text-xs">
                {editingRoadmapId ? (
                  <>
                    <Pencil size={15} className="text-[#C8A96A]" />
                    <span className="font-semibold text-[#F7F4EB]">
                      Editing: <span className="text-[#C8A96A]">{roadmapTitle || 'Selected Roadmap'}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="text-[#C8A96A]" />
                    <span className="font-semibold text-[#F7F4EB]">Creating a New Reading Roadmap</span>
                  </>
                )}
              </div>

              {editingRoadmapId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRoadmapId(null);
                    setActiveTab('list');
                  }}
                  className="text-xs text-[#A0A0A0] hover:text-[#F7F4EB] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Cancel Edit & Back to List</span>
                </button>
              )}
            </div>

            {/* Roadmap Title */}
            <div>
              <label className="block text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5">
                Roadmap Title *
              </label>
              <input
                type="text"
                required
                value={roadmapTitle}
                onChange={(e) => setRoadmapTitle(e.target.value)}
                placeholder={`e.g. Master ${selectedSubCategory} in 30 Days`}
                className="w-full px-4 py-2.5 rounded-xl bg-[#181818] border border-[#333333] text-sm text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A] transition-colors"
              />
            </div>

            {/* CASCADING DROPDOWNS SECTION (Requirement #6) */}
            <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#2e2e2e] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#2e2e2e]">
                <Layers size={16} className="text-[#C8A96A]" />
                <span className="text-xs font-bold text-[#F7F4EB] uppercase tracking-wider">
                  Subject & Level (Cascading Dropdown Lists - Req #6)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Dropdown 1: Main Category */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5">
                    1. Main Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#181818] border border-[#333333] text-sm text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A] transition-colors cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Dropdown 2: Cascading Sub-Category / Genre */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5">
                    2. Genre / Sub-Category (Cascading)
                  </label>
                  <select
                    value={selectedSubCategory}
                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#181818] border border-[#C8A96A] text-sm text-[#F7F4EB] focus:outline-none focus:ring-1 focus:ring-[#C8A96A] transition-colors cursor-pointer"
                  >
                    {(CASCADING_CATEGORIES[selectedCategory] || []).map((subCat) => (
                      <option key={subCat} value={subCat}>{subCat}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Dropdown 3: Mastery Level */}
              <div>
                <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5">
                  3. Target Mastery Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MASTERY_LEVELS.map((level) => {
                    const isSelected = masteryLevel === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setMasteryLevel(level)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'border-[#C8A96A] bg-[#C8A96A]/15 text-[#F7F4EB] shadow-sm'
                            : 'border-[#333333] bg-[#181818] text-[#888888] hover:border-[#444444]'
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DYNAMIC TEXTBOX MANIPULATION SECTION (Requirement #6) */}
            <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#2e2e2e] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2e2e2e]">
                <div className="flex items-center gap-2">
                  <Bookmark size={16} className="text-[#8FAE9B]" />
                  <span className="text-xs font-bold text-[#F7F4EB] uppercase tracking-wider">
                    Key Study Milestones ({milestones.length}) - Req #6
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#252525] hover:bg-[#C8A96A] text-[#C8A96A] hover:text-black border border-[#C8A96A]/40 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                >
                  <Plus size={13} />
                  <span>+ Add Milestone</span>
                </button>
              </div>

              <div className="space-y-2.5 pt-1">
                {milestones.map((milestone, idx) => (
                  <div key={idx} className="flex items-center gap-2 animate-fadeIn">
                    <span className="w-6 h-6 rounded-lg bg-[#282828] text-[#A0A0A0] text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      value={milestone}
                      onChange={(e) => handleMilestoneChange(idx, e.target.value)}
                      placeholder={`Milestone #${idx + 1} goal...`}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#181818] border border-[#333333] text-xs text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(idx)}
                      disabled={milestones.length <= 1}
                      className="p-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                      title="Remove milestone"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* INTERACTIVE DATEPICKER WITH PAST RESTRICTION (Requirement #14) */}
            <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#2e2e2e] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#C8A96A]" />
                  <label className="text-xs font-bold text-[#F7F4EB] uppercase tracking-wider">
                    Target Completion Date * (Requirement #14)
                  </label>
                </div>
                {targetDate && (
                  <span className="text-[11px] font-bold text-[#C8A96A] bg-[#C8A96A]/10 px-2.5 py-0.5 rounded-full border border-[#C8A96A]/20">
                    {getDaysStatus(targetDate)?.label}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <input
                  type="date"
                  required
                  min={todayIso} // Restricts selection of past dates (Requirement #14)
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#181818] border border-[#333333] text-sm text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A] transition-colors cursor-pointer"
                />

                <div className="p-3 rounded-xl bg-[#181818] border border-[#2e2e2e] text-xs">
                  <span className="text-[#A0A0A0]">Formatted Preview: </span>
                  <span className="font-semibold text-[#F7F4EB]">
                    {targetDate ? formatDatePreview(targetDate) : 'Select a date'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#333333]">
              <button
                type="button"
                onClick={() => {
                  if (editingRoadmapId) {
                    setEditingRoadmapId(null);
                    setActiveTab('list');
                  } else {
                    onClose();
                  }
                }}
                className="px-5 py-2.5 rounded-xl border border-[#333333] text-xs font-semibold text-[#A0A0A0] hover:text-[#F7F4EB] hover:bg-[#282828] transition-all cursor-pointer"
              >
                {editingRoadmapId ? 'Cancel Edit' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#C8A96A] to-[#B59659] hover:brightness-110 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Sparkles size={15} />
                <span>{editingRoadmapId ? 'Save Roadmap Changes' : 'Activate Reading Roadmap'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
