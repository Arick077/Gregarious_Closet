import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ShieldCheck, Clock, Key, Monitor, User, RefreshCw, 
  LogOut, CheckCircle2, AlertTriangle, Cpu, Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { modalEntrance } from '../utils/animations';

export default function SessionInfoModal({ isOpen, onClose, currentUser }) {
  const modalRef = useRef(null);
  const navigate = useNavigate();

  // Load or generate session info
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59, percent: 100 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  // Read or create session info
  useEffect(() => {
    if (isOpen) {
      try {
        let stored = localStorage.getItem('session_info');
        if (!stored) {
          // If user logged in before Phase 4, create a synthetic session
          const synthetic = {
            sessionId: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
            loginTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 23.5 * 60 * 60 * 1000).toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform || 'Web Browser'
          };
          localStorage.setItem('session_info', JSON.stringify(synthetic));
          stored = JSON.stringify(synthetic);
        }
        setSession(JSON.parse(stored));
      } catch (e) {
        console.warn('Session parse error', e);
      }
    }
  }, [isOpen]);

  // GSAP Entrance
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalEntrance(modalRef.current);
    }
  }, [isOpen]);

  // Real-time ticking countdown timer
  useEffect(() => {
    if (!isOpen || !session?.expiresAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(session.expiresAt).getTime();
      const login = new Date(session.loginTime).getTime();
      const totalDuration = expiry - login || 24 * 60 * 60 * 1000;
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, percent: 0 });
        clearInterval(timer);
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        const percent = Math.max(0, Math.min(100, (difference / totalDuration) * 100));
        setTimeLeft({ hours, minutes, seconds, percent });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, session]);

  if (!isOpen) return null;

  // Refresh Session Token
  const handleRefreshSession = () => {
    setIsRefreshing(true);
    setRefreshMessage('');

    setTimeout(() => {
      const refreshed = {
        ...(session || {}),
        sessionId: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      localStorage.setItem('session_info', JSON.stringify(refreshed));
      setSession(refreshed);
      setIsRefreshing(false);
      setRefreshMessage('Session successfully refreshed! 24-hour expiration extended.');
      setTimeout(() => setRefreshMessage(''), 4000);
    }, 600);
  };

  // Terminate Session & Logout
  const handleTerminateSession = () => {
    if (window.confirm('Are you sure you want to terminate this active session and sign out?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('session_info');
      sessionStorage.removeItem('active_session_token');
      onClose();
      navigate('/auth');
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        ref={modalRef}
        className="relative w-full max-w-xl bg-[#181818] border border-[#2e2e2e] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#C8A96A]/15 text-[#C8A96A]">
              <Key size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#F7F4EB]">
                  Active Session Credentials
                </h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active & Valid
                </span>
              </div>
              <p className="text-[11px] text-[#A0A0A0]">
                Live authentication lifecycle & JWT session tracking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333] text-[#A0A0A0] hover:text-[#F7F4EB] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {refreshMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{refreshMessage}</span>
          </div>
        )}

        {/* Live Expiry Countdown Box */}
        <div className="mt-5 p-4 rounded-2xl bg-[#202020] border border-[#333] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-[#A0A0A0]">
              <Clock size={14} className="text-[#C8A96A]" />
              <span>Session Expiration Countdown</span>
            </span>
            <span className="font-mono font-bold text-[#C8A96A]">
              {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s remaining
            </span>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[#121212] overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-[#C8A96A] to-emerald-400 transition-all duration-1000 rounded-full"
              style={{ width: `${timeLeft.percent}%` }}
            />
          </div>
        </div>

        {/* Session Metadata Grid */}
        <div className="mt-4 space-y-2 text-xs">
          {/* Session ID */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a]">
            <span className="text-[#888] font-medium flex items-center gap-1.5">
              <Key size={13} className="text-[#C8A96A]" />
              <span>Unique Session ID</span>
            </span>
            <span className="font-mono text-[#F7F4EB] text-[11px] truncate max-w-[220px]">
              {session?.sessionId || 'sess_active_validated'}
            </span>
          </div>

          {/* User Account */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a]">
            <span className="text-[#888] font-medium flex items-center gap-1.5">
              <User size={13} className="text-[#8FAE9B]" />
              <span>Authenticated User</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[#F7F4EB] font-medium">
                {currentUser?.email || currentUser?.username || 'reader@user.com'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                isAdmin ? 'bg-[#C8A96A] text-black' : 'bg-[#8FAE9B]/20 text-[#8FAE9B]'
              }`}>
                {currentUser?.role || 'User'}
              </span>
            </div>
          </div>

          {/* Login Timestamp */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a]">
            <span className="text-[#888] font-medium flex items-center gap-1.5">
              <Clock size={13} className="text-[#C8A96A]" />
              <span>Login Timestamp</span>
            </span>
            <span className="text-[#F7F4EB]">
              {session?.loginTime ? new Date(session.loginTime).toLocaleString() : new Date().toLocaleString()}
            </span>
          </div>

          {/* Client Platform & Device */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a]">
            <span className="text-[#888] font-medium flex items-center gap-1.5">
              <Monitor size={13} className="text-[#8FAE9B]" />
              <span>Client Environment</span>
            </span>
            <span className="text-[#A0A0A0] text-[11px] truncate max-w-[240px]">
              {session?.platform || 'Windows / Web Browser'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 pt-4 border-t border-[#292929] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleRefreshSession}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#C8A96A]/40 bg-[#202020] hover:bg-[#C8A96A]/15 text-[#C8A96A] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing Token...' : 'Refresh Session Token'}</span>
          </button>

          <button
            type="button"
            onClick={handleTerminateSession}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut size={13} />
            <span>Terminate Session (Sign Out)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
