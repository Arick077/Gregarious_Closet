import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Trash2, 
  Sparkles, 
  Send, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Cpu,
  User,
  ShieldCheck,
  Ban,
  CornerDownRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { analyzeSentiment, getSentimentBadgeProps } from '../utils/sentimentAnalyzer';
import { containsProfanity, getProfanityMatches, removeProfanity, cleanProfanity } from '../utils/profanityFilter';

/**
 * Social Comments Section with Real-Time TensorFlow.js Sentiment Analysis,
 * Like/Dislike Reactions, and Pagination Controls.
 * Fulfills Academic Requirements #1, #3, #8, and #12 at $0 Cost.
 */
export default function BookComments({ bookId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Comment input & real-time sentiment
  const [inputText, setInputText] = useState('');
  const [liveSentiment, setLiveSentiment] = useState(() => analyzeSentiment(''));
  const [moderationNotice, setModerationNotice] = useState('');
  const sentimentDebounceRef = useRef(null);

  const hasProfanity = containsProfanity(inputText);
  const detectedProfanity = getProfanityMatches(inputText);

  const handleRemoveProfanity = () => {
    const cleaned = removeProfanity(inputText);
    setInputText(cleaned);
    setLiveSentiment(analyzeSentiment(cleaned));
    setModerationNotice('Curse words removed from your message.');
    setTimeout(() => setModerationNotice(''), 3500);
  };

  // Reply State & Handlers
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyInputText, setReplyInputText] = useState('');
  const [replySentiment, setReplySentiment] = useState(() => analyzeSentiment(''));
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyErrorMsg, setReplyErrorMsg] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const replyDebounceRef = useRef(null);

  const hasReplyProfanity = containsProfanity(replyInputText);
  const detectedReplyProfanity = getProfanityMatches(replyInputText);

  const handleReplyInputChange = (e) => {
    const text = e.target.value;
    setReplyInputText(text);

    if (replyDebounceRef.current) clearTimeout(replyDebounceRef.current);
    replyDebounceRef.current = setTimeout(() => {
      setReplySentiment(analyzeSentiment(text));
    }, 120);
  };

  const handleRemoveReplyProfanity = () => {
    const cleaned = removeProfanity(replyInputText);
    setReplyInputText(cleaned);
    setReplySentiment(analyzeSentiment(cleaned));
  };

  const toggleRepliesExpanded = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleOpenReplyBox = (commentId) => {
    if (activeReplyId === commentId) {
      setActiveReplyId(null);
      setReplyInputText('');
    } else {
      setActiveReplyId(commentId);
      setReplyInputText('');
      setReplySentiment(analyzeSentiment(''));
      setReplyErrorMsg('');
      setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
    }
  };

  const handleSubmitReply = async (commentId) => {
    if (!replyInputText.trim()) return;

    if (hasReplyProfanity) {
      setReplyErrorMsg(`Please remove inappropriate language (${detectedReplyProfanity.map((w) => `"${w}"`).join(', ')}) before replying.`);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setReplyErrorMsg('Please log in to reply');
      return;
    }

    setIsSubmittingReply(true);
    setReplyErrorMsg('');

    try {
      const res = await fetch(`/api/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: replyInputText.trim(),
          sentiment: {
            label: replySentiment.label,
            score: replySentiment.score
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setComments((prev) =>
          prev.map((c) => {
            if (c._id !== commentId) return c;
            return {
              ...c,
              replies: [...(c.replies || []), data.reply]
            };
          })
        );
        setReplyInputText('');
        setActiveReplyId(null);
        setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
      } else {
        setReplyErrorMsg(data.message || 'Failed to post reply');
      }
    } catch (err) {
      console.error('Error posting reply:', err);
      setReplyErrorMsg('Network error posting reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/comments/${commentId}/replies/${replyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => {
            if (c._id !== commentId) return c;
            return {
              ...c,
              replies: (c.replies || []).filter((r) => r._id !== replyId)
            };
          })
        );
      } else {
        const data = await res.json();
        alert(data.message || 'Could not delete reply');
      }
    } catch (err) {
      console.error('Error deleting reply:', err);
      alert('Network error deleting reply');
    }
  };

  const handleToggleReplyReaction = async (commentId, replyId, reactionType) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMsg('Please log in to react to replies');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    setComments((prev) =>
      prev.map((c) => {
        if (c._id !== commentId) return c;
        return {
          ...c,
          replies: (c.replies || []).map((r) => {
            if (r._id !== replyId) return r;
            const currentReaction = r.userReaction;
            let newReaction = null;
            let newLikes = r.likesCount || 0;
            let newDislikes = r.dislikesCount || 0;

            if (reactionType === 'like') {
              if (currentReaction === 'like') {
                newReaction = null;
                newLikes = Math.max(0, newLikes - 1);
              } else {
                newReaction = 'like';
                newLikes += 1;
                if (currentReaction === 'dislike') {
                  newDislikes = Math.max(0, newDislikes - 1);
                }
              }
            } else if (reactionType === 'dislike') {
              if (currentReaction === 'dislike') {
                newReaction = null;
                newDislikes = Math.max(0, newDislikes - 1);
              } else {
                newReaction = 'dislike';
                newDislikes += 1;
                if (currentReaction === 'like') {
                  newLikes = Math.max(0, newLikes - 1);
                }
              }
            }

            return {
              ...r,
              userReaction: newReaction,
              likesCount: newLikes,
              dislikesCount: newDislikes
            };
          })
        };
      })
    );

    try {
      const res = await fetch(`/api/comments/${commentId}/replies/${replyId}/reaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type: reactionType })
      });

      const data = await res.json();
      if (!res.ok) {
        fetchComments(currentPage);
      } else {
        setComments((prev) =>
          prev.map((c) => {
            if (c._id !== commentId) return c;
            return {
              ...c,
              replies: (c.replies || []).map((r) =>
                r._id === replyId
                  ? {
                      ...r,
                      likesCount: data.likesCount,
                      dislikesCount: data.dislikesCount,
                      userReaction: data.userReaction
                    }
                  : r
              )
            };
          })
        );
      }
    } catch (err) {
      console.error('Reply reaction error:', err);
      fetchComments(currentPage);
    }
  };

  // Fetch paginated comments
  const fetchComments = useCallback(async (page = 1) => {
    if (!bookId) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/books/${bookId}/comments?page=${page}&limit=5`, { headers });
      const data = await res.json();

      if (res.ok) {
        setComments(data.comments || []);
        setTotalComments(data.totalComments || 0);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || page);
      } else {
        setErrorMsg(data.message || 'Failed to load comments');
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setErrorMsg('Network error loading discussion');
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  // Real-time sentiment evaluation as user types
  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);

    if (sentimentDebounceRef.current) {
      clearTimeout(sentimentDebounceRef.current);
    }

    sentimentDebounceRef.current = setTimeout(() => {
      const result = analyzeSentiment(text);
      setLiveSentiment(result);
    }, 120);
  };

  // Submit new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (hasProfanity) {
      setErrorMsg(`Cannot post: Please remove inappropriate language (${detectedProfanity.map((w) => `"${w}"`).join(', ')}) before posting.`);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMsg('Please log in to participate in the book discussion');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const sentimentPayload = {
        label: liveSentiment.label,
        score: liveSentiment.score
      };

      const res = await fetch(`/api/books/${bookId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: inputText.trim(),
          sentiment: sentimentPayload
        })
      });

      const data = await res.json();
      if (res.ok && data.comment) {
        setInputText('');
        setLiveSentiment(analyzeSentiment(''));
        // Refresh to page 1 to show the new comment on top
        fetchComments(1);
      } else {
        setErrorMsg(data.message || 'Failed to post comment');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setErrorMsg('Network error posting comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle reaction (like / dislike)
  const handleToggleReaction = async (commentId, reactionType) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMsg('Please log in to react to comments');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    // Optimistic UI update
    setComments((prev) =>
      prev.map((c) => {
        if (c._id !== commentId) return c;

        const currentReaction = c.userReaction;
        let newReaction = null;
        let newLikes = c.likesCount || 0;
        let newDislikes = c.dislikesCount || 0;

        if (reactionType === 'like') {
          if (currentReaction === 'like') {
            newReaction = null;
            newLikes = Math.max(0, newLikes - 1);
          } else {
            newReaction = 'like';
            newLikes += 1;
            if (currentReaction === 'dislike') {
              newDislikes = Math.max(0, newDislikes - 1);
            }
          }
        } else if (reactionType === 'dislike') {
          if (currentReaction === 'dislike') {
            newReaction = null;
            newDislikes = Math.max(0, newDislikes - 1);
          } else {
            newReaction = 'dislike';
            newDislikes += 1;
            if (currentReaction === 'like') {
              newLikes = Math.max(0, newLikes - 1);
            }
          }
        }

        return {
          ...c,
          userReaction: newReaction,
          likesCount: newLikes,
          dislikesCount: newDislikes
        };
      })
    );

    try {
      const res = await fetch(`/api/comments/${commentId}/reaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type: reactionType })
      });

      const data = await res.json();
      if (!res.ok) {
        // Revert on error
        fetchComments(currentPage);
      } else {
        // Sync exact counts from server
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  likesCount: data.likesCount,
                  dislikesCount: data.dislikesCount,
                  userReaction: data.userReaction
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Reaction request failed:', err);
      fetchComments(currentPage);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setTotalComments((prev) => Math.max(0, prev - 1));
      } else {
        const data = await res.json();
        alert(data.message || 'Could not delete comment');
      }
    } catch (err) {
      console.error('Delete comment error:', err);
      alert('Network error deleting comment');
    }
  };

  const sentimentProps = getSentimentBadgeProps(liveSentiment.label, liveSentiment.score);

  return (
    <div className="mt-6 pt-6 border-t border-[#2A2A2A] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-[#C8A96A]" />
          <h4 className="font-serif text-lg font-bold text-[#F7F4EB]">
            Reader Discussions & Reviews
          </h4>
          <span className="px-2 py-0.5 rounded-full bg-[#252525] text-[#A0A0A0] text-xs font-semibold">
            {totalComments}
          </span>
        </div>

        {/* AI Engine Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181818] border border-white/10 text-[11px] text-[#A0A0A0]">
          <Cpu size={13} className="text-[#8FAE9B]" />
          <span>TensorFlow.js AI Engine</span>
        </div>
      </div>

      {/* Comment Input Box with Live AI Sentiment Badge */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <div className="relative bg-[#171717] border border-[#333333] focus-within:border-[#C8A96A] rounded-2xl p-3 transition-all duration-200">
          <textarea
            value={inputText}
            onChange={handleInputChange}
            placeholder={
              currentUser 
                ? "Share your insights, chapter critique, or favorite quote from this book..."
                : "Sign in to leave a review and join the discussion..."
            }
            disabled={!currentUser || isSubmitting}
            rows={3}
            maxLength={1000}
            className="w-full bg-transparent text-[#F7F4EB] text-xs sm:text-sm placeholder-[#666666] resize-none focus:outline-none"
          />

          {/* Bottom Bar inside Input Box */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
            {/* Live AI Sentiment Feedback */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#777777] hidden md:inline">AI Tone:</span>
              <div 
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all duration-200 ${sentimentProps.bgColor} ${sentimentProps.textColor} ${sentimentProps.borderColor}`}
              >
                <span>{sentimentProps.emoji}</span>
                <span>{sentimentProps.label}</span>
                <span className="opacity-70">({Math.round(liveSentiment.score * 100)}%)</span>
              </div>

              {liveSentiment.details?.positiveTokens?.length > 0 && (
                <span className="text-[10px] text-emerald-400/80 hidden lg:inline">
                  +{liveSentiment.details.positiveTokens.slice(0, 2).join(', ')}
                </span>
              )}
              {liveSentiment.details?.negativeTokens?.length > 0 && (
                <span className="text-[10px] text-rose-400/80 hidden lg:inline">
                  -{liveSentiment.details.negativeTokens.slice(0, 2).join(', ')}
                </span>
              )}
            </div>

            {/* Character count & Submit Button */}
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-[11px] text-[#555555]">
                {inputText.length}/1000
              </span>

              <button
                type="submit"
                disabled={!currentUser || !inputText.trim() || isSubmitting || hasProfanity}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#C8A96A] to-[#B59659] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow transition-all cursor-pointer"
              >
                <Send size={13} />
                <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profanity / Curse Words Warning Banner with Action to Remove */}
        {hasProfanity && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-xs text-rose-200 shadow-lg animate-fadeIn">
            <div className="flex items-start sm:items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-semibold text-white">Inappropriate Language Detected:</span>{' '}
                <span>
                  Offensive words (
                  <span className="text-rose-300 font-mono font-bold">
                    {detectedProfanity.map((w) => `"${w}"`).join(', ')}
                  </span>
                  ) are not allowed. Please remove them to post.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveProfanity}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow shrink-0"
            >
              <span>⚡ Remove Curse Words</span>
            </button>
          </div>
        )}

        {/* Cleaned Toast / Moderation Notice */}
        {moderationNotice && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 p-2.5 rounded-xl animate-fadeIn">
            <CheckCircle size={14} />
            <span>{moderationNotice}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 p-2 rounded-xl">
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading && comments.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#777777]">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center bg-[#171717]/60 rounded-2xl border border-dashed border-white/10 p-6">
            <MessageSquare size={28} className="mx-auto text-[#444444] mb-2" />
            <p className="text-xs text-[#A0A0A0]">No reviews yet.</p>
            <p className="text-[11px] text-[#666666] mt-1">
              Be the first reader to analyze this work!
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const commentSentiment = getSentimentBadgeProps(
              comment.sentiment?.label || 'neutral',
              comment.sentiment?.score ?? 0.5
            );
            const isOwner = currentUser && (
              String(currentUser._id || currentUser.id) === String(comment.user?._id || comment.user)
            );
            const isAdmin = currentUser?.role === 'admin';
            const canDelete = isOwner || isAdmin;

            return (
              <div
                key={comment._id}
                className="p-4 bg-[#171717] rounded-2xl border border-white/5 space-y-3 hover:border-white/10 transition-colors"
              >
                {/* Comment Header: User Info & Sentiment Pill */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* User Avatar Circle */}
                    <div className="w-8 h-8 rounded-full bg-[#252525] border border-white/10 flex items-center justify-center text-xs font-bold text-[#C8A96A] shrink-0">
                      {comment.user?.username ? comment.user.username[0].toUpperCase() : 'U'}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#F7F4EB]">
                          {comment.user?.name || comment.user?.username || 'Reader'}
                        </span>
                        {comment.user?.role === 'admin' && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-[#C8A96A]/20 text-[#C8A96A] text-[9px] font-bold uppercase">
                            <ShieldCheck size={10} />
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#777777]">
                        {new Date(comment.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Sentiment Badge from TensorFlow Analysis */}
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${commentSentiment.bgColor} ${commentSentiment.textColor} ${commentSentiment.borderColor}`}
                    title={`TensorFlow.js Confidence: ${Math.round((comment.sentiment?.score ?? 0.5) * 100)}%`}
                  >
                    <span>{commentSentiment.emoji}</span>
                    <span className="capitalize">{commentSentiment.label}</span>
                  </div>
                </div>

                {/* Comment Text Content */}
                <p className="text-xs sm:text-sm text-[#E0E0E0] leading-relaxed whitespace-pre-wrap">
                  {cleanProfanity(comment.content)}
                </p>

                {/* Comment Actions: Like / Dislike / Reply / Show Replies / Delete */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    {/* Like Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleReaction(comment._id, 'like')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        comment.userReaction === 'like'
                          ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                          : 'bg-[#222222] text-[#888888] hover:text-[#F7F4EB] border border-transparent'
                      }`}
                      aria-label="Like comment"
                    >
                      <ThumbsUp size={13} className={comment.userReaction === 'like' ? 'fill-emerald-400' : ''} />
                      <span>{comment.likesCount || 0}</span>
                    </button>

                    {/* Dislike Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleReaction(comment._id, 'dislike')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        comment.userReaction === 'dislike'
                          ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                          : 'bg-[#222222] text-[#888888] hover:text-[#F7F4EB] border border-transparent'
                      }`}
                      aria-label="Dislike comment"
                    >
                      <ThumbsDown size={13} className={comment.userReaction === 'dislike' ? 'fill-rose-400' : ''} />
                      <span>{comment.dislikesCount || 0}</span>
                    </button>

                    {/* Reply Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenReplyBox(comment._id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        activeReplyId === comment._id
                          ? 'bg-[#C8A96A]/20 text-[#C8A96A] border border-[#C8A96A]/40'
                          : 'bg-[#222222] text-[#888888] hover:text-[#F7F4EB] border border-transparent'
                      }`}
                    >
                      <CornerDownRight size={13} />
                      <span>Reply</span>
                      {comment.replies?.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#303030] text-[10px] text-[#C8A96A] font-bold">
                          {comment.replies.length}
                        </span>
                      )}
                    </button>

                    {/* View / Hide Replies toggle */}
                    {comment.replies?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleRepliesExpanded(comment._id)}
                        className="text-[11px] text-[#A0A0A0] hover:text-[#C8A96A] flex items-center gap-1 ml-1 transition-colors cursor-pointer"
                      >
                        {expandedReplies[comment._id] ? (
                          <>
                            <ChevronUp size={12} />
                            <span>Hide replies</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} />
                            <span>{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Delete Button (Owner or Admin) */}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment._id)}
                      className="text-[#666666] hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                      title="Delete comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Inline Reply Input Box */}
                {activeReplyId === comment._id && (
                  <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
                      <span className="flex items-center gap-1.5">
                        <CornerDownRight size={13} className="text-[#C8A96A]" />
                        <span>
                          Replying to <strong className="text-[#F7F4EB]">@{comment.user?.name || comment.user?.username || 'Reader'}</strong>
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveReplyId(null)}
                        className="text-[#777777] hover:text-[#F7F4EB] text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="bg-[#121212] border border-[#333333] focus-within:border-[#C8A96A] rounded-xl p-2.5 transition-all">
                      <textarea
                        value={replyInputText}
                        onChange={handleReplyInputChange}
                        placeholder={`Reply to ${comment.user?.name || comment.user?.username || 'this review'}...`}
                        rows={2}
                        maxLength={1000}
                        disabled={!currentUser || isSubmittingReply}
                        className="w-full bg-transparent text-[#F7F4EB] text-xs placeholder-[#555555] resize-none focus:outline-none"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#666666]">AI Tone:</span>
                          {(() => {
                            const badge = getSentimentBadgeProps(replySentiment.label, replySentiment.score);
                            return (
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.bgColor} ${badge.textColor} ${badge.borderColor}`}>
                                <span>{badge.emoji}</span>
                                <span>{badge.label}</span>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-[10px] text-[#555555]">{replyInputText.length}/1000</span>
                          <button
                            type="button"
                            disabled={!currentUser || !replyInputText.trim() || isSubmittingReply || hasReplyProfanity}
                            onClick={() => handleSubmitReply(comment._id)}
                            className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#C8A96A] to-[#B59659] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow transition-all cursor-pointer"
                          >
                            <Send size={11} />
                            <span>{isSubmittingReply ? 'Posting...' : 'Reply'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {hasReplyProfanity && (
                      <div className="flex items-center justify-between p-2 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-200">
                        <span>Curse words detected ({detectedReplyProfanity.map((w) => `"${w}"`).join(', ')})</span>
                        <button
                          type="button"
                          onClick={handleRemoveReplyProfanity}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded transition-all cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {replyErrorMsg && (
                      <div className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded-xl">
                        {replyErrorMsg}
                      </div>
                    )}
                  </div>
                )}

                {/* Nested Threaded Replies List */}
                {expandedReplies[comment._id] && comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 pl-4 border-l-2 border-[#2c2c2c] space-y-2.5 animate-fadeIn">
                    {comment.replies.map((reply) => {
                      const replySentProps = getSentimentBadgeProps(
                        reply.sentiment?.label || 'neutral',
                        reply.sentiment?.score ?? 0.5
                      );
                      const isReplyOwner = currentUser && (
                        String(currentUser._id || currentUser.id) === String(reply.user?._id || reply.user)
                      );
                      const canDeleteReply = isReplyOwner || isAdmin;

                      return (
                        <div
                          key={reply._id}
                          className="p-3 bg-[#131313] rounded-xl border border-white/5 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#202020] border border-white/10 flex items-center justify-center text-[10px] font-bold text-[#C8A96A] shrink-0">
                                {reply.user?.username ? reply.user.username[0].toUpperCase() : 'U'}
                              </div>
                              <span className="text-xs font-semibold text-[#F7F4EB]">
                                {reply.user?.name || reply.user?.username || 'Reader'}
                              </span>
                              {reply.user?.role === 'admin' && (
                                <span className="px-1 py-0.2 rounded bg-[#C8A96A]/20 text-[#C8A96A] text-[9px] font-bold uppercase">
                                  Admin
                                </span>
                              )}
                              <span className="text-[10px] text-[#666666]">
                                {new Date(reply.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>

                            <div
                              className={`flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-medium border ${replySentProps.bgColor} ${replySentProps.textColor} ${replySentProps.borderColor}`}
                              title={`AI Sentiment: ${replySentProps.label}`}
                            >
                              <span>{replySentProps.emoji}</span>
                              <span className="capitalize">{replySentProps.label}</span>
                            </div>
                          </div>

                          <p className="text-xs text-[#D8D8D8] leading-relaxed whitespace-pre-wrap">
                            {cleanProfanity(reply.content)}
                          </p>

                          <div className="flex items-center justify-between pt-1 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleReplyReaction(comment._id, reply._id, 'like')}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                                  reply.userReaction === 'like'
                                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-[#1c1c1c] text-[#777777] hover:text-[#F7F4EB]'
                                }`}
                              >
                                <ThumbsUp size={11} className={reply.userReaction === 'like' ? 'fill-emerald-400' : ''} />
                                <span>{reply.likesCount || 0}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleReplyReaction(comment._id, reply._id, 'dislike')}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                                  reply.userReaction === 'dislike'
                                    ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                                    : 'bg-[#1c1c1c] text-[#777777] hover:text-[#F7F4EB]'
                                }`}
                              >
                                <ThumbsDown size={11} className={reply.userReaction === 'dislike' ? 'fill-rose-400' : ''} />
                                <span>{reply.dislikesCount || 0}</span>
                              </button>
                            </div>

                            {canDeleteReply && (
                              <button
                                type="button"
                                onClick={() => handleDeleteReply(comment._id, reply._id)}
                                className="text-[#666666] hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                                title="Delete reply"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls (Requirement #8) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-[#888888]">
          <span>
            Page <strong className="text-[#F7F4EB]">{currentPage}</strong> of{' '}
            <strong className="text-[#F7F4EB]">{totalPages}</strong> ({totalComments} comments)
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => fetchComments(currentPage - 1)}
              className="p-1.5 rounded-lg bg-[#202020] hover:bg-[#2c2c2c] disabled:opacity-30 disabled:cursor-not-allowed text-[#F7F4EB] cursor-pointer transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => fetchComments(pageNum)}
                disabled={isLoading}
                className={`w-7 h-7 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  currentPage === pageNum
                    ? 'bg-[#C8A96A] text-black shadow-md'
                    : 'bg-[#202020] hover:bg-[#2c2c2c] text-[#A0A0A0] hover:text-[#F7F4EB]'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => fetchComments(currentPage + 1)}
              className="p-1.5 rounded-lg bg-[#202020] hover:bg-[#2c2c2c] disabled:opacity-30 disabled:cursor-not-allowed text-[#F7F4EB] cursor-pointer transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

