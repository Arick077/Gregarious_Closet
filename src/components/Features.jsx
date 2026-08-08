import React from 'react';
import { Sparkles, Highlighter, Brain, Search, BookOpen, Layers, Bookmark, Cpu } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Highlighter,
      color: '#FDF498',
      title: 'Semantic Color Highlighting',
      description: 'Categorize your reading automatically with custom highlight tones—Yellow for core ideas, Blue for definitions, Green for insights, and Pink for action items.',
      tag: 'Highlight System'
    },
    {
      icon: Brain,
      color: '#C6E6FF',
      title: 'Conversational AI Assistant',
      description: 'Ask deep questions about complex chapters, get instant summaries, or challenge the author’s arguments through an AI trained on your reading materials.',
      tag: 'AI Assistant'
    },
    {
      icon: Search,
      color: '#D1F5EA',
      title: 'Cross-Library Search',
      description: 'Never lose a quote or reference. Search through thousands of pages in milliseconds with semantic vector matching across your entire library.',
      tag: 'Vault Search'
    },
    {
      icon: Layers,
      color: '#FFD1DC',
      title: 'Synthesis & Flashcard Decks',
      description: 'Transform passive notes into active recall decks. Export syntheses to Notion, Obsidian, Anki, or plain Markdown with one click.',
      tag: 'Knowledge Export'
    }
  ];

  return (
    <section id="Features" className="w-full py-20 bg-[#FFFBEB]/50 ">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-10 mb-16">
          
          <h2 className="text-4xl md:text-5xl font-serif text-[#191919] tracking-tight">
            Designed for Readers Who Want to <span className="font-italianno text-5xl md:text-6xl text-[#C8A96A] font-normal">Retain & Apply</span>
          </h2>
          <p className="text-[#555555] text-[#A0A0A0] text-lg">
            Gregarious Closet bridges the gap between passive reading and active comprehension with tools tailored for modern knowledge workers.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feat, idx) => {
            const IconComp = feat.icon;
            return (
              <div 
                key={idx}
                className="group relative p-8 rounded-3xl bg-[#FFFFFF] border border-[#E8E4DB]  shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between"
              >
                
                  {/* Top Bar with Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110"
                      style={{ backgroundColor: feat.color }}
                    >
                      <IconComp size={26} className="text-[#1E1E1E]" />
                    </div>
                
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-[#1E1E1E] mb-3 group-hover:text-[#C8A96A] transition-colors">
                    {feat.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[#555555] leading-relaxed">
                    {feat.description}
                  </p>
            

                {/* Bottom accent line */}
                <div className="mt-8 pt-4 border-t border-[#333333] flex items-center gap-1 text-xs font-semibold text-[#8FAE9B]">
                  <span>Learn more</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
