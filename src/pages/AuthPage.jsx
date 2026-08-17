import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import logoImg from '../assets/log_trans2.png';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Synchronize tab state with URL path (/signup vs /login)
  const [isSignUp, setIsSignUp] = useState(location.pathname === '/signup');

  useEffect(() => {
    setIsSignUp(location.pathname === '/signup');
  }, [location.pathname]);

  // Unified form data state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
    agreeTerms: false
  });

  // UI Toggles & Notifications
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Real-time Email Validation State
  const [emailTouched, setEmailTouched] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);

  // Email Regex Validator
  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'email') {
      setEmailTouched(true);
      setIsEmailValid(validateEmail(value));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Form Submission Logic
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (isSignUp && !formData.agreeTerms) {
      setErrorMessage('You must agree to the Terms of Service.');
      return;
    }

    setIsLoading(true);

    // Simulated API Authentication Call
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage(isSignUp ? 'Account created successfully!' : 'Welcome back!');
      setTimeout(() => navigate('/dashboard'), 1200);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#181818] text-[#F7F4EB] flex flex-col justify-between font-sans ">
      
      {/* HEADER */}
      <header className="p-6 max-w-[1280px] w-full mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <ArrowLeft size={20} className="text-[#8FAE9B] group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold text-[#A0A0A0]">Back to Home</span>
        </Link>

        <div className="flex items-center">
          <img 
            src={logoImg} 
            alt="Gregarious Closet Logo" 
            className="h-11 w-auto object-contain translate-y-[3px]" 
          />
          <span className="font-extrabold text-xl tracking-tight leading-none">
            Gregarious Closet
          </span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* RIGHT COLUMN: Auth Card (Mobile First: Displays first on mobile, right side on desktop) */}
        <div className="order-1 lg:order-2 lg:col-span-7 flex justify-center">
          <div className="w-full max-w-md bg-white dark:bg-[#202020] border border-[#E8E4DB] dark:border-[#333333] rounded-3xl p-8 shadow-sm">
            
            {/* Toggle Tabs (Login / Signup) */}
            <div className="flex bg-[#FAF7F2] dark:bg-[#181818] p-1.5 rounded-2xl mb-8 border border-[#E8E4DB] dark:border-[#333333]">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  !isSignUp
                    ? 'bg-white dark:bg-[#202020] text-[#1E1E1E] dark:text-[#F7F4EB] shadow-sm'
                    : 'text-[#555555] dark:text-[#A0A0A0] hover:text-[#1E1E1E]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  isSignUp
                    ? 'bg-white dark:bg-[#202020] text-[#1E1E1E] dark:text-[#F7F4EB] shadow-sm'
                    : 'text-[#555555] dark:text-[#A0A0A0] hover:text-[#1E1E1E]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                {successMessage}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name Field (Sign Up Only) */}
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] dark:text-[#A0A0A0] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555555]" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8E4DB] dark:border-[#333333] bg-[#FAF7F2] dark:bg-[#181818] text-sm focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                    />
                  </div>
                </div>
              )}

              {/* Email Field with Real-Time Validation */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] dark:text-[#A0A0A0]">
                    Email Address
                  </label>
                  {emailTouched && (
                    <span className={`text-[11px] font-semibold flex items-center gap-1 ${isEmailValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {isEmailValid ? 'Valid email' : 'Invalid email format'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555555]" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-[#FAF7F2] dark:bg-[#181818] text-sm focus:outline-none focus:ring-2 transition-all ${
                      emailTouched
                        ? isEmailValid
                          ? 'border-emerald-500 focus:ring-emerald-500/20'
                          : 'border-red-500 focus:ring-red-500/20'
                        : 'border-[#E8E4DB] dark:border-[#333333] focus:ring-[#8FAE9B]'
                    }`}
                  />
                  {/* Dynamic Status Icon */}
                  {emailTouched && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      {isEmailValid ? (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={18} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] dark:text-[#A0A0A0] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555555]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#E8E4DB] dark:border-[#333333] bg-[#FAF7F2] dark:bg-[#181818] text-sm focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#1E1E1E]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field (Sign Up Only) */}
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] dark:text-[#A0A0A0] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555555]" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#E8E4DB] dark:border-[#333333] bg-[#FAF7F2] dark:bg-[#181818] text-sm focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#1E1E1E]"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#8FAE9B] hover:bg-[#7D9D8A] text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>

          </div>
        </div>

        {/* LEFT COLUMN: Branding & Value Props (Mobile First: Displays second on mobile, left side on desktop) */}
        <div className="order-2 lg:order-1 lg:col-span-5 flex flex-col space-y-6">

          <h1 className="text-4xl lg:text-5xl font-serif leading-tight">
            Turn Every <span className="text-[#C8A96A] italic">Page</span> Into Knowledge.
          </h1>

          <p className="text-[#555555] dark:text-[#A0A0A0] text-base leading-relaxed">
            Join thousands of readers using AI-powered annotations, smart summaries, and real-time chapter discussions.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Interactive PDF/EPUB eReader Canvas',
              'Smart 4-Color Highlight Classifier',
              'AI Tutor Contextual Q&A',
              'Real-Time Community Discussions'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-medium">
                <CheckCircle2 size={18} className="text-[#8FAE9B] shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="p-4 text-center text-xs text-[#555555] dark:text-[#A0A0A0]">
        © 2026 Gregarious Closet. All rights reserved.
      </footer>
    </div>
  );
}