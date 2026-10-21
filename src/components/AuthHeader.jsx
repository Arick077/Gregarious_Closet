// src/components/AuthHeader.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logoImg from '../assets/log_trans2.png';

export default function AuthHeader() {
  return (
    <header className="px-6 py-4 max-w-[1280px] w-full mx-auto flex justify-between items-center shrink-0">
      {/* Back Link */}
      <Link to="/" className="flex items-center gap-2 group">
        <ArrowLeft size={18} className="text-[#8FAE9B] group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-semibold text-[#A0A0A0]">Back to Home</span>
      </Link>

      {/* Brand Logo & Name */}
      <div className="flex items-center gap-2.5">
        <img 
          src={logoImg} 
          alt="Gregarious Closet Logo" 
          className="h-8 w-auto object-contain translate-y-[1px]" 
        />
        <span className="font-extrabold text-lg tracking-tight leading-none">
          Gregarious Closet
        </span>
      </div>
    </header>
  );
}