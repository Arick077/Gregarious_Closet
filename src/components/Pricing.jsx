import React, { useState } from 'react';
import { Check, Sparkles, Star } from 'lucide-react';

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: 'Scholar Free',
      tagline: 'Perfect for casual readers',
      price: '$0',
      period: 'forever free',
      buttonText: 'Get Started Free',
      featured: false,
      features: [
        'Up to 5 active books',
        'Standard yellow & blue highlights',
        'Basic AI chapter summaries (10/mo)',
        'Local browser storage',
        'Standard export formats (TXT/PDF)',
      ],
    },
    {
      name: 'Reader Pro',
      tagline: 'For avid readers & students',
      price: annual ? '$12' : '$15',
      period: 'per month, billed annually',
      buttonText: 'Start 14-Day Free Trial',
      featured: true,
      badge: 'Most Popular',
      features: [
        'Unlimited active books & PDFs',
        'Full 4-color semantic highlights',
        'Unlimited AI Closet Assistant chats',
        'Cross-device cloud synchronization',
        'Anki, Notion & Obsidian auto-export',
        'Priority vector search',
      ],
    },
    {
      name: 'Researcher Vault',
      tagline: 'For academics & knowledge workers',
      price: annual ? '$29' : '$35',
      period: 'per month, billed annually',
      buttonText: 'Join Researcher Vault',
      featured: false,
      features: [
        'Everything in Reader Pro',
        'Multi-book comparative synthesis',
        'Custom AI prompting templates',
        'Team library sharing & collaboration',
        'API access & webhook integrations',
        'Dedicated priority support',
      ],
    },
  ];

  return (
    <section id="pricing" className="w-full py-20 bg-[#FFFBEB]/50 ">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-serif text-[#1E1E1E]  tracking-tight mt-10">
            Invest in Your <span className="font-italianno text-5xl md:text-6xl text-[#C8A96A] font-normal">Personal Knowledge</span>
          </h2>
          <p className="text-[#555555]  text-lg">
            Choose the plan that fits your reading volume. Upgrade, downgrade, or cancel anytime.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!annual ? 'text-[#1E1E1E]  font-bold' : 'text-[#555555]'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className="w-14 h-8 rounded-full bg-[#E8E4DB]  p-1 relative transition-colors duration-300 focus:outline-none"
            >
              <div className={`w-6 h-6 rounded-full bg-[#C8A96A] shadow-md transform transition-transform duration-300 ${annual ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-medium flex items-center gap-1.5 ${annual ? 'text-[#1E1E1E]  font-bold' : 'text-[#555555]'}`}>
              Annual <span className="text-xs px-2 py-0.5 rounded-full bg-[#FDF498] text-[#1E1E1E] font-bold">Save 20%</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <div 
              key={idx}
              className={`relative rounded-3xl p-8 transition-all duration-300 flex flex-col justify-between ${
                plan.featured 
                  ? 'bg-[#FFFFFF]  border-2 border-[#C8A96A] shadow-2xl scale-105 z-10' 
                  : 'bg-[#FFFFFF]  border border-[#E8E4DB]  shadow-md hover:shadow-xl'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#C8A96A] text-white text-xs font-bold shadow-md flex items-center gap-1">
                  <Star size={12} fill="white" />
                  <span>{plan.badge}</span>
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="text-center pb-6 border-b border-[#E8E4DB]  space-y-2">
                  <h3 className="text-2xl font-bold text-[#1E1E1E] ">{plan.name}</h3>
                  <p className="text-xs text-[#555555] ">{plan.tagline}</p>
                  <div className="pt-4">
                    <span className="text-4xl lg:text-5xl font-extrabold text-[#1E1E1E] ">{plan.price}</span>
                    <span className="text-xs text-[#555555]  block mt-1">{plan.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="py-6 space-y-3.5 text-sm text-[#1E1E1E] ">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-[#8FAE9B]/20 text-[#8FAE9B] flex items-center justify-center flex-shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="text-sm">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button 
                className={`w-full py-3 px-6 rounded-xl font-italianno text-3xl transition-all cursor-pointer shadow-sm ${
                  plan.featured
                    ? 'bg-[#C8A96A] text-white hover:bg-[#B59659]'
                    : 'bg-[#F7F4EB]  text-[#1E1E1E]  hover:bg-[#EDE9DE] '
                }`}
              >
                {plan.buttonText}
              </button>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
