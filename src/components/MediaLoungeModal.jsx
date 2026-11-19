import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Film, Headphones, Play, Pause, Volume2, VolumeX, 
  ExternalLink, Disc, BookOpen, Music, Check, Sparkles,
  Upload, Plus, Trash2, Link2, FileAudio, FolderPlus,
  Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import { modalEntrance } from '../utils/animations';
import '../styles/media-player.scss';

// Helper to extract YouTube video ID from various URL formats
function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match) return match[1];
  if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

// Format seconds into mm:ss
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const DEFAULT_VIDEOS = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Book Review: The Art of Reading',
    channel: 'Literary Closet Reviews',
    duration: '03:32'
  },
  {
    id: 'jNQXAC9IVRw',
    title: 'Author Talk: First Principles & Deep Philosophy',
    channel: 'Masterclass Discussions',
    duration: '04:15'
  },
  {
    id: '9bZkp7q19f0',
    title: 'Literature Breakdown: Modern Classics',
    channel: 'Humanities & Culture',
    duration: '04:12'
  },
  {
    id: 'kJQP7kiw5Fk',
    title: 'Speed Reading & Cognitive Retention Techniques',
    channel: 'Digital Scholar',
    duration: '03:50'
  }
];

const DEFAULT_TRACKS = [
  {
    id: 'art_of_war',
    title: 'The Art of War – Chapter 1: Laying Plans',
    author: 'Sun Tzu',
    url: 'https://www.archive.org/download/art_of_war_librivox/art_of_war_01_sun_tzu_64kb.mp3',
    source: 'LibriVox / Internet Archive (Public Domain)'
  },
  {
    id: 'pride_and_prejudice',
    title: 'Pride and Prejudice – Chapter 1',
    author: 'Jane Austen',
    url: 'https://www.archive.org/download/pride_and_prejudice_librivox/prideandprejudice_01_austen_64kb.mp3',
    source: 'LibriVox / Internet Archive (Public Domain)'
  },
  {
    id: 'sherlock_holmes',
    title: 'Sherlock Holmes – A Scandal in Bohemia',
    author: 'Sir Arthur Conan Doyle',
    url: 'https://www.archive.org/download/adventures_sherlock_holmes_0711_librivox/adventuresofsherlockholmes_01_doyle_64kb.mp3',
    source: 'LibriVox / Internet Archive (Public Domain)'
  }
];

export default function MediaLoungeModal({ 
  isOpen, 
  onClose, 
  initialTab = 'video', 
  initialVideoUrl = null,
  initialAudioUrl = null,
  initialBookTitle = null 
}) {
  const modalRef = useRef(null);
  const audioRef = useRef(null);

  const [activeTab, setActiveTab] = useState(initialTab); // 'video' | 'audio'
  
  // Video state (with localStorage persistence)
  const [videos, setVideos] = useState(() => {
    try {
      const saved = localStorage.getItem('gc_custom_videos');
      if (saved) {
        const custom = JSON.parse(saved);
        return [...custom, ...DEFAULT_VIDEOS];
      }
    } catch (e) {
      console.warn('Failed to load saved videos', e);
    }
    return DEFAULT_VIDEOS;
  });
  const [selectedVideoId, setSelectedVideoId] = useState(DEFAULT_VIDEOS[0].id);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [videoError, setVideoError] = useState('');
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  
  // Audio state
  const [tracks, setTracks] = useState(DEFAULT_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  // Audio Upload / Add state
  const [isAddAudioOpen, setIsAddAudioOpen] = useState(false);
  const [audioAddMode, setAudioAddMode] = useState('file'); // 'file' | 'url'
  const [newAudioFile, setNewAudioFile] = useState(null);
  const [newAudioTitle, setNewAudioTitle] = useState('');
  const [newAudioAuthor, setNewAudioAuthor] = useState('');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [audioFormError, setAudioFormError] = useState('');

  // Video Search & Pagination
  const [videoSearch, setVideoSearch] = useState('');
  const [videoPage, setVideoPage] = useState(1);
  const [videoLimit, setVideoLimit] = useState(4); // 4 per page for a clean 1-row layout

  // Audio Search & Pagination
  const [audioSearch, setAudioSearch] = useState('');
  const [audioPage, setAudioPage] = useState(1);
  const [audioLimit, setAudioLimit] = useState(4);

  // Filtered & Paginated Videos
  const filteredVideos = videos.filter((vid) => {
    if (!videoSearch.trim()) return true;
    const q = videoSearch.toLowerCase();
    return (
      (vid.title && vid.title.toLowerCase().includes(q)) ||
      (vid.channel && vid.channel.toLowerCase().includes(q))
    );
  });

  const totalVideoPages = Math.ceil(filteredVideos.length / videoLimit) || 1;
  const safeVideoPage = Math.min(videoPage, totalVideoPages);
  const videoStartIndex = (safeVideoPage - 1) * videoLimit;
  const paginatedVideos = filteredVideos.slice(videoStartIndex, videoStartIndex + videoLimit);

  useEffect(() => {
    setVideoPage(1);
  }, [videoSearch, videoLimit]);

  // Filtered & Paginated Audio Tracks
  const filteredTracks = tracks.filter((t) => {
    if (!audioSearch.trim()) return true;
    const q = audioSearch.toLowerCase();
    return (
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.author && t.author.toLowerCase().includes(q)) ||
      (t.source && t.source.toLowerCase().includes(q))
    );
  });

  const totalAudioPages = Math.ceil(filteredTracks.length / audioLimit) || 1;
  const safeAudioPage = Math.min(audioPage, totalAudioPages);
  const audioStartIndex = (safeAudioPage - 1) * audioLimit;
  const paginatedTracks = filteredTracks.slice(audioStartIndex, audioStartIndex + audioLimit);

  useEffect(() => {
    setAudioPage(1);
  }, [audioSearch, audioLimit]);

  // GSAP modal entrance
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalEntrance(modalRef.current);
    }
  }, [isOpen]);

  // Persist custom added videos to localStorage
  useEffect(() => {
    try {
      const customOnly = videos.filter((v) => v.isCustom);
      localStorage.setItem('gc_custom_videos', JSON.stringify(customOnly));
    } catch (e) {
      console.warn('Failed to save videos to localStorage', e);
    }
  }, [videos]);

  // Handle external video/audio passed in when opening from a book
  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);

      if (initialVideoUrl) {
        const parsed = extractYouTubeId(initialVideoUrl);
        if (parsed) {
          setSelectedVideoId(parsed);
          setActiveTab('video');
          setVideos((prev) => {
            if (prev.some((v) => v.id === parsed)) return prev;
            return [{
              id: parsed,
              title: initialBookTitle ? `${initialBookTitle} (Video Review)` : 'Book Video Review',
              channel: 'Curated Review',
              duration: 'Review',
              isCustom: true
            }, ...prev];
          });
        }
      }

      if (initialAudioUrl) {
        setActiveTab('audio');
        // Add or switch to this custom track
        const exists = tracks.find((t) => t.url === initialAudioUrl);
        if (!exists) {
          const newTrack = {
            id: `custom_${Date.now()}`,
            title: initialBookTitle ? `${initialBookTitle} (Sample)` : 'Audiobook Sample',
            author: 'Book Audiobook Sample',
            url: initialAudioUrl,
            source: 'Selected Book Vault'
          };
          setTracks((prev) => [newTrack, ...prev]);
          setCurrentTrackIndex(0);
        } else {
          const idx = tracks.findIndex((t) => t.url === initialAudioUrl);
          if (idx !== -1) setCurrentTrackIndex(idx);
        }
      }
    }
  }, [isOpen, initialTab, initialVideoUrl, initialAudioUrl, initialBookTitle]);

  // Sync audio src on track change
  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.load();
      setCurrentTime(0);
      if (isPlaying) {
        setAudioLoading(true);
        audioRef.current.play()
          .then(() => setAudioLoading(false))
          .catch((err) => {
            console.warn('Auto-play blocked or audio load error:', err);
            setIsPlaying(false);
            setAudioLoading(false);
          });
      }
    }
  }, [currentTrackIndex, currentTrack?.url]);

  // Synchronize audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Stop audio when closing modal
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Custom YouTube URL submit & save to menu
  const handleLoadCustomVideo = async (e) => {
    e.preventDefault();
    if (!customVideoUrl.trim()) return;

    const parsed = extractYouTubeId(customVideoUrl.trim());
    if (!parsed) {
      setVideoError('Please enter a valid YouTube video URL or ID.');
      return;
    }

    setIsVideoLoading(true);
    setSelectedVideoId(parsed);
    setVideoError('');

    // Check if already in the list
    const exists = videos.find((v) => v.id === parsed);
    if (exists) {
      setCustomVideoUrl('');
      setIsVideoLoading(false);
      return;
    }

    // Fetch video title and author using public oEmbed / noembed
    let title = 'YouTube Video';
    let channel = 'Custom Video';
    try {
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${parsed}`);
      if (response.ok) {
        const data = await response.json();
        if (data.title) title = data.title;
        if (data.author_name) channel = data.author_name;
      }
    } catch {
      title = `Custom Video (${parsed})`;
    }

    const newVideo = {
      id: parsed,
      title,
      channel,
      duration: 'Custom',
      isCustom: true
    };

    setVideos((prev) => [newVideo, ...prev]);
    setCustomVideoUrl('');
    setIsVideoLoading(false);
  };

  const handleDeleteVideo = (e, videoId) => {
    e.stopPropagation();
    if (window.confirm('Remove this video from your menu?')) {
      setVideos((prev) => {
        const remaining = prev.filter((v) => v.id !== videoId);
        return remaining.length > 0 ? remaining : DEFAULT_VIDEOS;
      });
      if (selectedVideoId === videoId) {
        const remaining = videos.filter((v) => v.id !== videoId);
        if (remaining.length > 0) {
          setSelectedVideoId(remaining[0].id);
        }
      }
    }
  };

  // Audio controls
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setAudioLoading(true);
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setAudioLoading(false);
        })
        .catch((err) => {
          console.error('Audio play error:', err);
          setIsPlaying(false);
          setAudioLoading(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setAudioLoading(false);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Custom Audio Upload & Track Management
  const handleAudioFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAudioFile(file);
      setAudioFormError('');
      if (!newAudioTitle.trim()) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setNewAudioTitle(nameWithoutExt);
      }
    }
  };

  const handleAddAudioTrack = (e) => {
    e.preventDefault();
    setAudioFormError('');

    if (audioAddMode === 'file') {
      if (!newAudioFile) {
        setAudioFormError('Please select an audio file (MP3, M4A, WAV, etc.) from your device.');
        return;
      }
      const objectUrl = URL.createObjectURL(newAudioFile);
      const newTrack = {
        id: `local_${Date.now()}`,
        title: newAudioTitle.trim() || newAudioFile.name,
        author: newAudioAuthor.trim() || 'Uploaded Audiobook',
        url: objectUrl,
        source: 'Uploaded Audio File',
        isCustom: true
      };

      setTracks((prev) => [newTrack, ...prev]);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      setNewAudioFile(null);
      setNewAudioTitle('');
      setNewAudioAuthor('');
      setIsAddAudioOpen(false);
    } else {
      if (!newAudioUrl.trim()) {
        setAudioFormError('Please enter a valid audio stream or MP3 URL.');
        return;
      }
      const newTrack = {
        id: `url_${Date.now()}`,
        title: newAudioTitle.trim() || 'Custom Audiobook Stream',
        author: newAudioAuthor.trim() || 'Online Audio',
        url: newAudioUrl.trim(),
        source: 'External Stream URL',
        isCustom: true
      };

      setTracks((prev) => [newTrack, ...prev]);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      setNewAudioUrl('');
      setNewAudioTitle('');
      setNewAudioAuthor('');
      setIsAddAudioOpen(false);
    }
  };

  const handleDeleteTrack = (e, trackId) => {
    e.stopPropagation();
    if (window.confirm('Remove this custom audiobook track from your playlist?')) {
      setTracks((prev) => {
        const remaining = prev.filter((t) => t.id !== trackId);
        return remaining.length > 0 ? remaining : DEFAULT_TRACKS;
      });
      setCurrentTrackIndex(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        ref={modalRef}
        className="relative w-full max-w-4xl bg-[#181818] border border-[#292929] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Hidden HTML5 Audio Element */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            // Next track on end
            if (currentTrackIndex < tracks.length - 1) {
              setCurrentTrackIndex((prev) => prev + 1);
            } else {
              setIsPlaying(false);
            }
          }}
          onError={() => {
            setAudioLoading(false);
            setIsPlaying(false);
          }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#181818] border-b border-[#292929]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#C8A96A]/15 text-[#C8A96A]">
              <Film size={20} />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#F7F4EB] leading-tight">
                Media Lounge
              </h3>
              <p className="text-[11px] text-[#A0A0A0]">
                Curated book discussions, YouTube author reviews & public domain audiobook samples
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333333] text-[#A0A0A0] hover:text-[#F7F4EB] flex items-center justify-center text-sm transition-colors cursor-pointer"
            aria-label="Close Media Lounge"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-3 px-6 pt-3 pb-2 bg-[#1c1c1c] border-b border-[#292929]">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-[#C8A96A] text-black shadow-lg shadow-[#C8A96A]/20'
                : 'text-[#A0A0A0] hover:text-[#F7F4EB] hover:bg-[#252525]'
            }`}
          >
            <Film size={15} />
            <span>🎬 Video Theater</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-[#C8A96A] text-black shadow-lg shadow-[#C8A96A]/20'
                : 'text-[#A0A0A0] hover:text-[#F7F4EB] hover:bg-[#252525]'
            }`}
          >
            <Headphones size={15} />
            <span>🎧 Audio Library</span>
          </button>
        </div>

        {/* Tab 1: Video Theater */}
        {activeTab === 'video' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Main Video Player Embed */}
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-[#333] bg-black" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full rounded-2xl"
                src={`https://www.youtube.com/embed/${selectedVideoId}?rel=0&autoplay=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Custom URL Input Box */}
            <form onSubmit={handleLoadCustomVideo} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customVideoUrl}
                onChange={(e) => setCustomVideoUrl(e.target.value)}
                placeholder="Paste any YouTube video URL or ID (e.g., https://youtu.be/...)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#202020] border border-[#333333] text-xs sm:text-sm text-[#F7F4EB] placeholder-[#666666] focus:outline-none focus:border-[#C8A96A] transition-colors"
                disabled={isVideoLoading}
              />
              <button
                type="submit"
                disabled={isVideoLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-[#C8A96A] to-[#B59659] hover:brightness-110 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                {isVideoLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving & Loading...</span>
                  </>
                ) : (
                  <span>Load Video</span>
                )}
              </button>
            </form>
            {videoError && <p className="text-xs text-rose-400">{videoError}</p>}

            {/* Curated YouTube Video Grid & Saved Videos Menu */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A0A0A0]">
                    Video Theater Menu ({filteredVideos.length})
                  </h4>
                  <span className="text-[11px] text-[#777777]">
                    Loaded videos stay saved in your menu
                  </span>
                </div>

                {/* Search Bar for Videos */}
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
                  <input
                    type="text"
                    value={videoSearch}
                    onChange={(e) => setVideoSearch(e.target.value)}
                    placeholder="Search videos by title or channel..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#202020] border border-[#333] text-xs text-[#F7F4EB] placeholder-[#666] focus:outline-none focus:border-[#C8A96A] transition-colors"
                  />
                  {videoSearch && (
                    <button
                      type="button"
                      onClick={() => setVideoSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777] hover:text-[#fff] cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {paginatedVideos.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[#202020]/50 border border-dashed border-[#333]">
                  <p className="text-xs text-[#888]">No videos found matching "{videoSearch}".</p>
                  <button
                    type="button"
                    onClick={() => setVideoSearch('')}
                    className="mt-2 text-xs text-[#C8A96A] hover:underline cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {paginatedVideos.map((vid) => {
                    const isSelected = selectedVideoId === vid.id;
                    return (
                      <div
                        key={vid.id}
                        onClick={() => setSelectedVideoId(vid.id)}
                        className={`group relative rounded-xl overflow-hidden bg-[#202020] border transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-[#C8A96A] ring-1 ring-[#C8A96A]' 
                            : 'border-[#333333] hover:border-[#555]'
                        }`}
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-[#121212]">
                          <img
                            src={`https://img.youtube.com/vi/${vid.id}/mqdefault.jpg`}
                            alt={vid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono">
                            {vid.duration}
                          </span>

                          {vid.isCustom && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#C8A96A] text-[9px] text-black font-bold uppercase shadow">
                              Saved
                            </span>
                          )}

                          {vid.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteVideo(e, vid.id)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/75 hover:bg-rose-900 text-[#aaa] hover:text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow"
                              title="Remove from saved videos"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-semibold text-[#F7F4EB] line-clamp-1 group-hover:text-[#C8A96A] transition-colors" title={vid.title}>
                            {vid.title}
                          </p>
                          <p className="text-[10px] text-[#777777] mt-0.5 truncate">{vid.channel}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Video Pagination Controls */}
              {totalVideoPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-white/5 text-xs text-[#888]">
                  <span>
                    Showing <strong className="text-[#F7F4EB]">{videoStartIndex + 1}</strong>–
                    <strong className="text-[#F7F4EB]">{Math.min(videoStartIndex + videoLimit, filteredVideos.length)}</strong> of{' '}
                    <strong className="text-[#F7F4EB]">{filteredVideos.length}</strong> videos
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safeVideoPage <= 1}
                      onClick={() => setVideoPage((prev) => Math.max(1, prev - 1))}
                      className="p-1.5 rounded-lg bg-[#202020] hover:bg-[#2c2c2c] disabled:opacity-30 disabled:cursor-not-allowed text-[#F7F4EB] transition-colors cursor-pointer"
                      title="Previous page"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalVideoPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setVideoPage(p)}
                          className={`w-6 h-6 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            p === safeVideoPage
                              ? 'bg-[#C8A96A] text-black shadow'
                              : 'bg-[#202020] hover:bg-[#2c2c2c] text-[#888] hover:text-[#fff]'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={safeVideoPage >= totalVideoPages}
                      onClick={() => setVideoPage((prev) => Math.min(totalVideoPages, prev + 1))}
                      className="p-1.5 rounded-lg bg-[#202020] hover:bg-[#2c2c2c] disabled:opacity-30 disabled:cursor-not-allowed text-[#F7F4EB] transition-colors cursor-pointer"
                      title="Next page"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Audio Library */}
        {activeTab === 'audio' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* SASS-Styled Custom Audio Player */}
            <div className="media-player">
              <div className="player-info">
                <div className="p-2.5 rounded-full bg-[#C8A96A]/20 text-[#C8A96A] shrink-0">
                  <Disc size={24} className={isPlaying ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="track-title">{currentTrack?.title}</div>
                  <div className="track-artist">Author: {currentTrack?.author} • {currentTrack?.source}</div>
                </div>
              </div>

              {/* Controls */}
              <div className="player-controls">
                <button 
                  onClick={togglePlayPause} 
                  className="play-btn"
                  aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                >
                  {audioLoading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause size={18} />
                  ) : (
                    <Play size={18} className="translate-x-0.5" />
                  )}
                </button>
              </div>

              {/* Progress Slider */}
              <div className="progress-section">
                <span className="time-display">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.5"
                  value={currentTime}
                  onChange={handleSeek}
                  className="progress-bar"
                />
                <span className="time-display">{formatTime(duration)}</span>
              </div>

              {/* Volume */}
              <div className="volume-section">
                <button onClick={toggleMute} className="volume-btn" aria-label="Toggle mute">
                  {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>

              {/* Track Playlist Header with Upload/Add Audiobook Button */}
              <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#888888]">
                    Audiobook Playlist ({filteredTracks.length})
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Search Bar for Audio Tracks */}
                    <div className="relative w-full sm:w-52">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#777]" />
                      <input
                        type="text"
                        value={audioSearch}
                        onChange={(e) => setAudioSearch(e.target.value)}
                        placeholder="Search audiobooks..."
                        className="w-full pl-7 pr-6 py-1 rounded-lg bg-[#202020] border border-[#333] text-xs text-[#F7F4EB] placeholder-[#666] focus:outline-none focus:border-[#C8A96A] transition-colors"
                      />
                      {audioSearch && (
                        <button
                          type="button"
                          onClick={() => setAudioSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#777] hover:text-[#fff] cursor-pointer"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddAudioOpen(!isAddAudioOpen)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#C8A96A]/15 hover:bg-[#C8A96A]/25 border border-[#C8A96A]/40 text-[#C8A96A] text-xs font-semibold transition-all cursor-pointer shadow-sm whitespace-nowrap"
                    >
                      <Plus size={13} />
                      <span>{isAddAudioOpen ? 'Cancel' : 'Upload / Add'}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Upload / Add Audiobook Form Panel */}
                {isAddAudioOpen && (
                  <form onSubmit={handleAddAudioTrack} className="mb-3.5 p-3.5 bg-[#141414] border border-[#333333] rounded-2xl space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <Upload size={14} className="text-[#C8A96A]" />
                        <span className="text-xs font-bold text-[#F7F4EB]">Add New Audiobook to Player</span>
                      </div>
                      
                      {/* Sub-tabs: Local File vs Stream URL */}
                      <div className="flex items-center gap-1 bg-[#202020] p-0.5 rounded-lg border border-[#333]">
                        <button
                          type="button"
                          onClick={() => setAudioAddMode('file')}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                            audioAddMode === 'file' ? 'bg-[#C8A96A] text-black font-bold' : 'text-[#888] hover:text-[#fff]'
                          }`}
                        >
                          📁 Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setAudioAddMode('url')}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                            audioAddMode === 'url' ? 'bg-[#C8A96A] text-black font-bold' : 'text-[#888] hover:text-[#fff]'
                          }`}
                        >
                          🔗 Audio URL
                        </button>
                      </div>
                    </div>

                    {audioAddMode === 'file' ? (
                      <div>
                        <label className="block p-3.5 rounded-xl border border-dashed border-[#444] hover:border-[#C8A96A] bg-[#1a1a1a] text-center cursor-pointer transition-colors">
                          <FileAudio size={24} className="mx-auto text-[#C8A96A] mb-1.5" />
                          <span className="text-xs font-semibold text-[#F7F4EB] block">
                            {newAudioFile ? newAudioFile.name : 'Click to select Audiobook File (MP3, M4A, WAV, AAC, OGG)'}
                          </span>
                          <span className="text-[10px] text-[#777] mt-0.5 block">
                            {newAudioFile ? `${(newAudioFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to play instantly` : 'Loads and plays directly in your browser'}
                          </span>
                          <input
                            type="file"
                            accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg"
                            onChange={handleAudioFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          value={newAudioUrl}
                          onChange={(e) => setNewAudioUrl(e.target.value)}
                          placeholder="Paste direct audio URL (e.g. https://.../chapter1.mp3)"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#202020] border border-[#333] text-xs text-[#F7F4EB] placeholder-[#666] focus:outline-none focus:border-[#C8A96A]"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newAudioTitle}
                        onChange={(e) => setNewAudioTitle(e.target.value)}
                        placeholder="Audiobook Title (e.g. Sapiens Chapter 1)"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#202020] border border-[#333] text-xs text-[#F7F4EB] placeholder-[#666] focus:outline-none focus:border-[#C8A96A]"
                      />
                      <input
                        type="text"
                        value={newAudioAuthor}
                        onChange={(e) => setNewAudioAuthor(e.target.value)}
                        placeholder="Author / Narrator (Optional)"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#202020] border border-[#333] text-xs text-[#F7F4EB] placeholder-[#666] focus:outline-none focus:border-[#C8A96A]"
                      />
                    </div>

                    {audioFormError && (
                      <p className="text-[11px] text-rose-400 font-medium">{audioFormError}</p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setIsAddAudioOpen(false)}
                        className="px-3 py-1 text-xs text-[#888] hover:text-[#fff] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#C8A96A] hover:bg-[#B59659] text-black font-semibold text-xs rounded-lg shadow transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Play size={12} />
                        <span>Add & Play Track</span>
                      </button>
                    </div>
                  </form>
                )}

                {paginatedTracks.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-[#202020]/40 border border-dashed border-[#333]">
                    <p className="text-xs text-[#888]">No audiobooks found matching "{audioSearch}".</p>
                    <button
                      type="button"
                      onClick={() => setAudioSearch('')}
                      className="mt-1.5 text-xs text-[#C8A96A] hover:underline cursor-pointer"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  <div className="track-list">
                    {paginatedTracks.map((t) => {
                      const masterIdx = tracks.findIndex((item) => item.id === t.id);
                      const isCurrent = masterIdx === currentTrackIndex;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            if (masterIdx !== -1) setCurrentTrackIndex(masterIdx);
                            setIsPlaying(true);
                          }}
                          className={`track-item ${isCurrent ? 'active' : ''}`}
                        >
                          <div className="p-1 rounded-full bg-[#202020] text-[#C8A96A] shrink-0">
                            {isCurrent && isPlaying ? <Pause size={12} /> : <Play size={12} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="track-name flex items-center gap-2">
                              <span className="truncate">{t.title}</span>
                              {t.isCustom && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#C8A96A]/20 text-[#C8A96A] font-bold uppercase shrink-0">
                                  Uploaded
                                </span>
                              )}
                            </div>
                            <div className="track-source truncate">{t.author} • {t.source}</div>
                          </div>

                          {t.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTrack(e, t.id)}
                              className="p-1 text-[#666] hover:text-rose-400 rounded transition-colors ml-1 shrink-0"
                              title="Delete custom track"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Audio Pagination Controls */}
                {totalAudioPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs text-[#888]">
                    <span>
                      Showing <strong className="text-[#F7F4EB]">{audioStartIndex + 1}</strong>–
                      <strong className="text-[#F7F4EB]">{Math.min(audioStartIndex + audioLimit, filteredTracks.length)}</strong> of{' '}
                      <strong className="text-[#F7F4EB]">{filteredTracks.length}</strong> tracks
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={safeAudioPage <= 1}
                        onClick={() => setAudioPage((prev) => Math.max(1, prev - 1))}
                        className="p-1.5 rounded-lg bg-[#202020] hover:bg-[#2c2c2c] disabled:opacity-30 disabled:cursor-not-allowed text-[#F7F4EB] transition-colors cursor-pointer"
                        title="Previous page"
                      >
                        <ChevronLeft size={14} />
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalAudioPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setAudioPage(p)}
                            className={`w-6 h-6 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                              p === safeAudioPage
                                ? 'bg-[#C8A96A] text-black shadow'
                                : 'bg-[#202020] hover:bg-[#2c2c2c] text-[#888] hover:text-[#fff]'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={safeAudioPage >= totalAudioPages}
                        onClick={() => setAudioPage((prev) => Math.min(totalAudioPages, prev + 1))}
                        className="p-1.5 rounded-lg bg-[#202020] hover:bg-[#2c2c2c] disabled:opacity-30 disabled:cursor-not-allowed text-[#F7F4EB] transition-colors cursor-pointer"
                        title="Next page"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

