import React, { useState, useEffect } from 'react';
import { Star, Sparkles, Check } from 'lucide-react';

/**
 * Interactive 5-Star Book Rating Component (Requirement #7)
 * Displays live average, total ratings, and allows authenticated users to submit/update ratings.
 */
export default function StarRating({
  bookId,
  initialAverageRating = 0,
  initialTotalRatings = 0,
  onRatingUpdated,
  readonly = false
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(null);
  const [averageRating, setAverageRating] = useState(Number(initialAverageRating) || 0);
  const [totalRatings, setTotalRatings] = useState(Number(initialTotalRatings) || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Fetch current user's rating for this book if logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !bookId) return;

    let isMounted = true;
    const fetchUserRating = async () => {
      try {
        const res = await fetch(`/api/books/${bookId}/rating`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.userRating) setUserRating(data.userRating);
            if (typeof data.averageRating === 'number') setAverageRating(data.averageRating);
            if (typeof data.totalRatings === 'number') setTotalRatings(data.totalRatings);
          }
        }
      } catch (err) {
        console.error('Error fetching book rating:', err);
      }
    };

    fetchUserRating();
    return () => { isMounted = false; };
  }, [bookId]);

  // Sync props changes if book changes
  useEffect(() => {
    setAverageRating(Number(initialAverageRating) || 0);
    setTotalRatings(Number(initialTotalRatings) || 0);
  }, [initialAverageRating, initialTotalRatings]);

  const handleRatingClick = async (starValue) => {
    if (readonly) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setFeedbackMsg('Please log in to rate this book');
      setTimeout(() => setFeedbackMsg(''), 3000);
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg('');

    try {
      const res = await fetch(`/api/books/${bookId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating: starValue })
      });

      const data = await res.json();
      if (res.ok) {
        setUserRating(starValue);
        setAverageRating(data.averageRating);
        setTotalRatings(data.totalRatings);
        setFeedbackMsg(`Rated ${starValue} star${starValue > 1 ? 's' : ''}!`);
        setTimeout(() => setFeedbackMsg(''), 2500);

        if (onRatingUpdated) {
          onRatingUpdated(data.averageRating, data.totalRatings, starValue);
        }
      } else {
        setFeedbackMsg(data.message || 'Failed to submit rating');
        setTimeout(() => setFeedbackMsg(''), 3000);
      }
    } catch (err) {
      console.error('Rating submission failed:', err);
      setFeedbackMsg('Network error submitting rating');
      setTimeout(() => setFeedbackMsg(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#171717] rounded-2xl border border-white/5">
      {/* Left: Interactive Stars + User Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = (hoverRating || userRating || 0) >= star;
            return (
              <button
                key={star}
                type="button"
                disabled={readonly || isSubmitting}
                onClick={() => handleRatingClick(star)}
                onMouseEnter={() => !readonly && setHoverRating(star)}
                onMouseLeave={() => !readonly && setHoverRating(0)}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                className={`p-1 rounded-lg transition-all duration-150 cursor-pointer ${
                  readonly 
                    ? 'cursor-default' 
                    : 'hover:scale-115 active:scale-95 focus:outline-none'
                }`}
              >
                <Star
                  size={20}
                  className={`transition-colors duration-150 ${
                    isFilled
                      ? 'fill-[#F5B544] text-[#F5B544] drop-shadow-[0_0_6px_rgba(245,181,68,0.4)]'
                      : 'fill-transparent text-[#444444] hover:text-[#777777]'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="text-xs">
          {userRating ? (
            <span className="flex items-center gap-1 font-semibold text-[#8FAE9B]">
              <Check size={13} />
              <span>Your rating: {userRating}/5</span>
            </span>
          ) : (
            <span className="text-[#888888] italic">
              {hoverRating > 0 ? `Rate ${hoverRating} star${hoverRating > 1 ? 's' : ''}` : 'Tap a star to rate'}
            </span>
          )}
        </div>
      </div>

      {/* Right: Live Aggregates */}
      <div className="flex items-center gap-2 text-xs">
        {feedbackMsg ? (
          <span className="text-[#C8A96A] font-medium animate-fadeIn">{feedbackMsg}</span>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#202020] border border-white/10">
            <span className="font-bold text-[#F7F4EB]">{averageRating > 0 ? averageRating.toFixed(1) : '—'}</span>
            <span className="text-[#C8A96A]">★</span>
            <span className="text-[#777777]">({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})</span>
          </div>
        )}
      </div>
    </div>
  );
}

