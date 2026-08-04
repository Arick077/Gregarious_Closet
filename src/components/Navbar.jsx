import React from "react";
import logo from "../assets/logo.png";

export default function Navbar({}) {
  return (
    <header className="w-full min-h-[75px] bg-[#FFFBEB] flex items-center justify-center py-2 shadow-xl hover:shadow-2xl transition-shadow duration-300">
      
      {/* Container limiting maximum desktop width matching standard layouts */}
      <div className="w-full max-w-[1440px] px-6 flex justify-between items-center">
        
        {/* LEFT SECTON: Logo and Navigation Menu grouped together */}
        <div className="flex items-center gap-12">
          {/* Logo Area */}
          <div className="h-14 flex items-center">
            <img 
              className="h-full w-auto object-contain"
              src={logo} // Fixed slashes
              alt="Gregarious Closet Logo" // Professional alt text
            />
          </div>

          {/* Navigation Area with proper semantic tags */}
          <nav>
            <ul className="flex gap-8 font-italianno text-3xl items-center">
              <li><a href="#home" className="hover:opacity-75 transition-opacity">Home</a></li>
              <li><a href="#works" className="hover:opacity-75 transition-opacity">How It Works</a></li>
              <li><a href="#Features" className="hover:opacity-75 transition-opacity">Features</a></li>
              <li><a href="#pricing" className="hover:opacity-75 transition-opacity">Pricing</a></li>
              <li><a href="#demo" className="hover:opacity-75 transition-opacity">Demo</a></li>
            </ul>
          </nav>
        </div>

        {/* RIGHT SECTION: Styled User Actions */}
        <div className="flex gap-4 items-center">
          <button className="font-italianno text-3xl py-2 px-6 bg-[#C8A96A] rounded-xl hover:bg-[#b59659] transition-colors min-w-[110px]">
            Login
          </button>
          <button className="font-italianno text-3xl py-2 px-6 bg-[#C8A96A] rounded-xl hover:bg-[#b59659] transition-colors min-w-[110px]">
            Sign Up
          </button>
        </div>

      </div>
    </header>
  );
}