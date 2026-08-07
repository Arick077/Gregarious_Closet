import React from "react";
import logo from "../assets/log_trans2.png";

export default function HeroLp() {
  return (
    <section id="home" className=" relative flex min-h-[calc(100vh-75px)] w-full items-center bg-[#FAF8F5]">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-8 px-5 py-12 lg:grid-cols-12">
        
        {/* LEFT COLUMN: Text Content & CTAs */}
        <div className="flex flex-col justify-center gap-6 lg:col-span-6">
          {/* Heading */}
          <h1 className="font-sans text-4xl font-extrabold tracking-tight text-[#1E1E1E] sm:text-5xl lg:text-6xl">
            Where Every{" "}
            <span className="text-[#C8A96A]">Page</span>
            <br />
            <span>
              Becomes <span className="text-[#C8A96A]">Knowledge</span>
            </span>
          </h1>

          {/* Subtitle / Description */}
          <p className="max-w-xl font-sans text-lg font-normal leading-relaxed text-[#555555] sm:text-xl">
            From reading to thinking experience a smarter way to engage with books.
            Highlight, annotate, and interact with AI to truly understand what you read.
          </p>
          {/* Call-to-action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#demo"
              className="flex items-center justify-center gap-3 rounded-2xl bg-[#C8A96A] px-8 py-3.5 font-sans text-xl font-medium text-white shadow-lg transition-all transform hover:-translate-y-0.5 hover:bg-[#B59659] hover:shadow-xl active:translate-y-0"
            >
              <span>Get Started Now</span>
            </a>

            <a
              href="#works"
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#1E1E1E] bg-transparent px-8 py-3.5 font-sans text-base font-medium text-[#1E1E1E] transition-all transform hover:-translate-y-0.5 hover:border-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-[#F7F4ED] hover:shadow-xl active:translate-y-0"
            >
              <span>See How It Works</span>
            </a>
          </div>
        </div>

        {/* RIGHT COLUMN:  */}
        <div className="group relative flex w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-3xl border border-[#E8E4DB] bg-gradient-to-b from-[#FAF8F5] to-[#F3EEE3] p-4 sm:p-6 shadow-xl lg:col-span-6">
  
          {/* Ambient Background Glow */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-[#C8A96A]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-[#C8A96A]/10 blur-3xl" />

          <div className="flex flex-col items-center justify-center z-10">
            <div className="transform transition-transform duration-500 hover:scale-105">
              <img
                src={logo}
                alt="Gregarious Closet AI Companion"
                className="h-72 w-72 object-contain drop-shadow-xl sm:h-80 sm:w-80 lg:h-96 lg:w-96"
              />
            </div>

            <div className="text-center -mt-20 pb-10 z-10">
              <h3 className="font-sans text-3xl font-bold tracking-tight text-[#1E1E1E] sm:text-4xl">
                Gregarious Closet
              </h3>
              <p className="mt-0.5 font-sans text-xs font-semibold uppercase tracking-widest text-[#C8A96A] sm:text-sm">
                Your Personal AI Reading Tutor
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}