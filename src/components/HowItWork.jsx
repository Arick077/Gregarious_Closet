import React from "react";
import { Upload, Highlighter, MessageSquare, GraduationCap } from 'lucide-react';
export default function HowItwork() {

    const steps = [
    {
      num: '01',
      icon: Upload,
      title: 'Upload Your Library',
      desc: 'Import your PDFs, EPUBs, or web articles seamlessly into your private Gregarious Closet vault.'
    },
    {
      num: '02',
      icon: Highlighter,
      title: 'Highlight & Annotate',
      desc: 'Apply your custom color palette (Yellow, Blue, Green, Pink) to tag key ideas, definitions, and actions.'
    },
    {
      num: '03',
      icon: MessageSquare,
      title: 'Interact with AI',
      desc: 'Engage in dialog with your book. Ask for simplifications, chapter breakdowns, or contrasting viewpoints.'
    },
    {
      num: '04',
      icon: GraduationCap,
      title: 'Own Your Knowledge',
      desc: 'Export structured summaries, flashcards, and interconnected notes directly to your personal knowledge system.'
    }
  ]
   const Icon = steps[0].icon;

    return(
        <section id="works" className="w-full py-20 bg-[#191919] transition-colors duration-300" >
            <div className="max-w-[1440px] mx-auto px-6 md:px-12">
                 {/* heading of the section  */}
                  <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                    <h2 className="text-4xl md:text-5xl font-serif text-[#F7F4EB] tracking-tight">
                      How <span className="font-italianno text-5xl md:text-6xl text-[#C8A96A] font-normal">Gregarious Closet</span> Works
                    </h2>
                    <p className="text-[#555555] dark:text-[#A0A0A0] text-lg">
                      Transform reading from a passive routine into an active knowledge building system in four effortless steps.
                    </p>
                  </div>

                  {/* card part of the section  */}
                  <div className="grid grid-cols01 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {
                          steps.map((step) => {
                              const Icon = step.icon;

                              return (
                              <div  key={step.num}
                              className="relative p-8 rounded-3xl bg-[#242424] border border-[#333333] shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-6">
                                  <span className="font-italianno text-5xl text-[#C8A96A] font-bold">
                                    {step.num}
                                  </span>
                                  <div className="w-10 h-10 rounded-xl bg-[#1F1F1F] text-[#8FAE9B] flex items-center justify-center border border-[#333333]">
                                    <Icon size={24} />
                                  </div>
                                </div>

                                <h3 className="text-xl font-bold text-[#F7F4EB] mb-3">
                                  {step.title}
                                </h3>  

                                  <p className="text-sm text-[#A0A0A0] leading-relaxed pb-10">
                                    {step.desc}
                                  </p>
                              </div>
                              );
                          })
                      }
                  </div>
            </div>
           
            

        </section>
    )
}