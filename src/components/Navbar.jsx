import React, { useState } from "react";
import logo from "../assets/logo.png";
import { Menu, X } from "lucide-react";

export default function Navbar({}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky sticky top-0 z-50 w-full min-h-[75px] bg-[#FFFBEB] flex items-center justify-center py-2 shadow-xl hover:shadow-2xl transition-shadow duration-300 relative z-50">
      
      {/* Container limiting maximum desktop width matching standard layouts */}
      <div className="w-full max-w-[1440px] px-6 flex justify-between items-center">
        
        {/* LEFT SECTION: Logo and Navigation Menu grouped together */}
        <div className="flex items-center gap-12">
          {/* Logo Area */}
          <div className="h-14 flex items-center">
            <img 
              className="h-full w-auto object-contain"
              src={logo} 
              alt="Gregarious Closet Logo" 
            />
          </div>

          {/* Navigation Area - Desktop */}
          <nav className="hidden lg:block">
            <ul className="flex gap-8 font-italianno text-3xl items-center">
              <li><a href="#home" className="hover:opacity-75 transition-opacity">Home</a></li>
              <li><a href="#works" className="hover:opacity-75 transition-opacity">How It Works</a></li>
              <li><a href="#Features" className="hover:opacity-75 transition-opacity">Features</a></li>
              <li><a href="#pricing" className="hover:opacity-75 transition-opacity">Pricing</a></li>
              <li><a href="#demo" className="hover:opacity-75 transition-opacity">Demo</a></li>
            </ul>
          </nav>
        </div>

        {/* RIGHT SECTION: Styled User Actions - Desktop */}
        <div className="hidden lg:flex gap-4 items-center">
          <button className="font-italianno text-3xl py-2 px-6 bg-[#C8A96A] rounded-xl hover:bg-[#b59659] transition-colors min-w-[110px]">
            Login
          </button>
          <button className="font-italianno text-3xl py-2 px-6 bg-[#C8A96A] rounded-xl hover:bg-[#b59659] transition-colors min-w-[110px]">
            Sign Up
          </button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="lg:hidden p-2 text-[#1E1E1E] focus:outline-none"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

      </div>

      {/* MOBILE MENU DROPDOWN */}
      <div className={`absolute top-full left-0 w-full bg-[#FFFBEB] border-t border-[#E8E4DB] shadow-lg flex flex-col items-center py-6 gap-6 lg:hidden z-50 transition-all duration-300 ease-in-out
                          ${isOpen
                            ? "opacity-100 translate-y-0 visible"
                            : "opacity-0 -translate-y-2 invisible"}
                        `}>
          <nav>
            <ul className="flex flex-col gap-4 font-italianno text-3xl items-center">
              <li><a href="#home" onClick={() => setIsOpen(false)} className="hover:opacity-75 transition-opacity">Home</a></li>
              <li><a href="#works" onClick={() => setIsOpen(false)} className="hover:opacity-75 transition-opacity">How It Works</a></li>
              <li><a href="#Features" onClick={() => setIsOpen(false)} className="hover:opacity-75 transition-opacity">Features</a></li>
              <li><a href="#pricing" onClick={() => setIsOpen(false)} className="hover:opacity-75 transition-opacity">Pricing</a></li>
              <li><a href="#demo" onClick={() => setIsOpen(false)} className="hover:opacity-75 transition-opacity">Demo</a></li>
            </ul>
          </nav>

          <div className="flex flex-col gap-3 items-center w-full px-8">
            <button className="w-full font-italianno text-3xl py-2 bg-[#C8A96A] rounded-xl hover:bg-[#b59659] transition-colors">
              Login
            </button>
            <button className="w-full font-italianno text-3xl py-2 bg-[#C8A96A] rounded-xl hover:bg-[#b59659] transition-colors">
              Sign Up
            </button>
          </div>
        </div>
    </header>
  );
}