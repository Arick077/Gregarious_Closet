import React from 'react';
import { BookOpen, Sparkles, Heart, Share2, Globe, MessageCircle, Mail, ArrowUp } from 'lucide-react';
import logoImg from '../assets/logo.png';
import logotrans from '../assets/log_trans2.png';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <footer className="w-full bg-[#151515] text-[#F7F4EB] pt-16 pb-12">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 space-y-12">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#333333]">
          
          {/* Column 1: Brand & Slogan */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={logotrans} 
                alt="Gregarious Closet Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="font-bold text-2xl tracking-tight text-[#F7F4EB]">
                Gregarious Closet
              </span>
            </div>
            
            <p className="font-italianno text-2xl text-[#A0A0A0] leading-relaxed max-w-sm">
              "Where Every Page Becomes Knowledge. Transform how you read, reflect, and retain."
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a href="#share" aria-label="Share" className="w-9 h-9 rounded-full bg-[#242424] border border-[#E8E4DB] dark:border-[#333333] flex items-center justify-center text-[#A0A0A0] hover:text-[#C8A96A] hover:border-[#C8A96A] transition-all">
                <Share2 size={18} />
              </a>
              <a href="#website" aria-label="Website" className="w-9 h-9 rounded-full bg-[#FFFFFF] dark:bg-[#242424] border border-[#333333] flex items-center justify-center text-[#A0A0A0] hover:text-[#C8A96A] hover:border-[#C8A96A] transition-all">
                <Globe size={18} />
              </a>
              <a href="#community" aria-label="Community" className="w-9 h-9 rounded-full bg-[#242424] border border-[#E8E4DB] dark:border-[#333333] flex items-center justify-center text-[#A0A0A0] hover:text-[#C8A96A] hover:border-[#C8A96A] transition-all">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#C8A96A]">Product</h4>
            <ul className="space-y-2 text-sm text-[#A0A0A0]">
              <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Key Features</a></li>
              <li><a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
            </ul>
          </div>

          {/* Column 3: Features & Integration */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#C8A96A]">Knowledge Vault</h4>
            <ul className="space-y-2 text-sm text-[#A0A0A0]">
              <li><a href="#highlight" className="hover:text-[#1E1E1E] dark:hover:text-white transition-colors">Semantic Highlights</a></li>
              <li><a href="#ai" className="hover:text-white transition-colors">Closet AI Chat</a></li>
              <li><a href="#notion" className="hover:text-[#1E1E1E] dark:hover:text-white transition-colors">Notion & Anki Sync</a></li>
              <li><a href="#vector" className="hover:text-white transition-colors">Vector Search</a></li>
              <li><a href="#api" className="hover:text-white transition-colors">Developer API</a></li>
            </ul>
          </div>

          {/* Column 4: Newsletter Signup */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#C8A96A]">Reading Newsletter</h4>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Get weekly curated book breakdowns and AI reading workflows straight to your inbox.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="w-full py-2.5 px-3.5 pl-9 rounded-xl bg-[#242424] border-[#333333] text-xs text-white focus:outline-none focus:border-[#C8A96A]"
                />
                <Mail size={14} className="absolute left-3 top-3 text-[#555555]" />
              </div>
              <button 
                type="submit"
                className="w-full py-2 px-4 rounded-xl bg-[#C8A96A] text-white font-italianno text-2xl hover:bg-[#B59659] transition-all cursor-pointer shadow-sm"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A0A0A0] pt-4">
          <p>© {new Date().getFullYear()} Gregarious Closet Inc. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#cookies" className="hover:text-white transition-colors">Cookie Settings</a>
          </div>

          <button 
            onClick={scrollToTop} 
            className="p-2 rounded-xl bg-[#242424] border border-[#333333] text-[#F7F4EB] hover:bg-[#EDE9DE] transition-all flex items-center gap-1"
            title="Scroll to top"
          >
            <ArrowUp size={14} />
            <span>Top</span>
          </button>
        </div>

      </div>
    </footer>
  );
}
