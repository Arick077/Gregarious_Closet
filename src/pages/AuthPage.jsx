import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthHeader from '../components/AuthHeader';

export default function LoginPage() {
  const navigate = useNavigate();

  // Login Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Email Validation State
  const [emailTouched, setEmailTouched] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('Server connection error. Make sure your backend server is running.');
      }

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setSuccessMessage('Welcome back! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setErrorMessage(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Server connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#181818] text-[#F7F4EB] flex flex-col justify-between font-sans">
      
      {/* HEADER */}
      <AuthHeader />

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* RIGHT COLUMN: Login Card */}
        <div className="order-1 lg:order-2 lg:col-span-7 flex justify-center">
          <div className="w-full max-w-md bg-[#202020] border border-[#333333] rounded-3xl p-8 shadow-sm">
            
            {/* Tab Navigation */}
            <div className="flex bg-[#181818] p-1.5 rounded-2xl mb-8 border border-[#333333]">
              <button
                type="button"
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-[#202020] text-[#F7F4EB] shadow-sm transition-all"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-[#A0A0A0] hover:text-[#F7F4EB] transition-all cursor-pointer"
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/20 text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-900/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Address */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A0A0A0]">
                    Email Address
                  </label>
                  {emailTouched && (
                    <span className={`text-[11px] font-semibold flex items-center gap-1 ${isEmailValid ? 'text-emerald-400' : 'text-red-500'}`}>
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
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-[#181818] text-sm focus:outline-none focus:ring-2 transition-all ${
                      emailTouched
                        ? isEmailValid
                          ? 'border-emerald-500 focus:ring-emerald-500/20'
                          : 'border-red-500 focus:ring-red-500/20'
                        : 'border-[#333333] focus:ring-[#8FAE9B]'
                    }`}
                  />
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

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A0A0A0]">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-[#8FAE9B] hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555555]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#333333] bg-[#181818] text-sm focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#F7F4EB] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="rounded border-[#333333] text-[#8FAE9B] focus:ring-[#8FAE9B] cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-xs text-[#A0A0A0] cursor-pointer">
                  Remember me on this device
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#8FAE9B] hover:bg-[#7D9D8A] text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>

          </div>
        </div>

        {/* LEFT COLUMN: Branding & Features */}
        <div className="order-2 lg:order-1 lg:col-span-5 flex flex-col space-y-6">
          <h1 className="text-4xl lg:text-5xl font-serif leading-tight">
            Turn Every <span className="text-[#C8A96A] italic">Page</span> Into Knowledge.
          </h1>

          <p className="text-[#A0A0A0] text-base leading-relaxed">
            Welcome back! Log in to access your personal bookshelf, annotations, and AI study companion.
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
      <footer className="p-4 text-center text-xs text-[#A0A0A0]">
        © 2026 Gregarious Closet. All rights reserved.
      </footer>
    </div>
  );
}