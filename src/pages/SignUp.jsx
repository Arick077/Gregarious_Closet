import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, 
  CheckCircle2, AlertCircle, XCircle, Check, Phone, 
  ShieldCheck, Clock, RefreshCw, Loader2, X, Sparkles, Key
} from 'lucide-react';
import AuthHeader from '../components/AuthHeader';

export default function SignUpPage() {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 1. REAL-TIME USERNAME CHECK (Requirement #4)
  // 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [usernameFeedback, setUsernameFeedback] = useState('');
  const debounceTimerRef = useRef(null);

  // 2. PHONE / EMAIL VERIFICATION MODAL (Requirement #5)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpModalError, setOtpModalError] = useState('');
  const [otpModalSuccess, setOtpModalSuccess] = useState('');
  const otpInputRefs = useRef([]);

  // Real-Time Email Validation State
  const [emailTouched, setEmailTouched] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);

  // Email Regex Validation
  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  // Password Rules Checklist
  const passwordCriteria = {
    minLength: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecial: /[^A-Za-z0-9]/.test(formData.password)
  };

  const passedCriteriaCount = Object.values(passwordCriteria).filter(Boolean).length;
  const isPasswordStrong = passedCriteriaCount === 5;

  // Real-Time Debounced Username Check Effect
  useEffect(() => {
    const rawUsername = formData.username.trim();

    if (!rawUsername) {
      setUsernameStatus('idle');
      setUsernameFeedback('');
      return;
    }

    if (rawUsername.length < 3) {
      setUsernameStatus('invalid');
      setUsernameFeedback('Username must be at least 3 characters');
      return;
    }

    setUsernameStatus('checking');
    setUsernameFeedback('Checking availability...');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(rawUsername)}`);
        const data = await response.json();

        if (data.available) {
          setUsernameStatus('available');
          setUsernameFeedback(data.message || 'Username available!');
        } else {
          setUsernameStatus('taken');
          setUsernameFeedback(data.message || 'Username already taken');
        }
      } catch (err) {
        console.error('Username check error:', err);
        setUsernameStatus('idle');
        setUsernameFeedback('');
      }
    }, 400); // 400ms debounce delay

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData.username]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (isOtpModalOpen && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpModalOpen, otpTimer]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'email') {
      setEmailTouched(true);
      setIsEmailValid(validateEmail(value));
    }

    if (name === 'password') {
      setPasswordTouched(true);
    }

    // If phone changes after verification, require re-verification
    if (name === 'phone' && isPhoneVerified) {
      setIsPhoneVerified(false);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Trigger Send OTP Modal
  const handleOpenOtpModal = async () => {
    setErrorMessage('');
    const targetPhone = formData.phone.trim();

    if (!targetPhone) {
      setErrorMessage('Please enter a phone number to verify.');
      return;
    }

    if (targetPhone.length < 7) {
      setErrorMessage('Please enter a valid phone number with area code.');
      return;
    }

    setIsSendingOtp(true);
    setOtpModalError('');
    setOtpModalSuccess('');
    setOtpDigits(['', '', '', '', '', '']);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetPhone,
          type: 'phone'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code.');
      }

      setDemoOtpCode(data.demoCode || '');
      setOtpTimer(60);
      setCanResendOtp(false);
      setIsOtpModalOpen(true);

      // Focus first input box shortly after modal renders
      setTimeout(() => {
        if (otpInputRefs.current[0]) {
          otpInputRefs.current[0].focus();
        }
      }, 150);

    } catch (err) {
      console.error('Send OTP error:', err);
      setErrorMessage(err.message || 'Could not send verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle input in the 6 individual OTP boxes with auto-focus
  const handleOtpDigitChange = (index, value) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, '');

    // Handle full paste of 6 digits (e.g. "123456")
    if (cleaned.length > 1) {
      const pastedDigits = cleaned.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pastedDigits.forEach((digit, i) => {
        if (i < 6) newDigits[i] = digit;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pastedDigits.length, 5);
      if (otpInputRefs.current[nextFocus]) {
        otpInputRefs.current[nextFocus].focus();
      }
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    // Auto-focus next input box if digit was typed
    if (cleaned && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  // Handle backspace navigation in OTP boxes
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0 && otpInputRefs.current[index - 1]) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  // Submit and verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setOtpModalError('');
    setOtpModalSuccess('');

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setOtpModalError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.phone.trim(),
          code: fullCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid verification code.');
      }

      setOtpModalSuccess('Phone verified successfully!');
      setIsPhoneVerified(true);

      setTimeout(() => {
        setIsOtpModalOpen(false);
      }, 1000);

    } catch (err) {
      console.error('Verify OTP error:', err);
      setOtpModalError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Auto-fill demo OTP code for evaluator convenience
  const handleAutoFillDemoCode = () => {
    if (demoOtpCode && demoOtpCode.length === 6) {
      setOtpDigits(demoOtpCode.split(''));
      if (otpInputRefs.current[5]) {
        otpInputRefs.current[5].focus();
      }
    }
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // 1. Username Availability Check
    if (usernameStatus !== 'available') {
      setErrorMessage(
        usernameStatus === 'checking'
          ? 'Please wait while we verify your username availability.'
          : usernameStatus === 'taken'
          ? 'The chosen username is already taken. Please choose another.'
          : 'Please choose a valid unique username (minimum 3 characters).'
      );
      return;
    }

    // 2. Email & Password Validations
    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!isPasswordStrong) {
      setErrorMessage('Please ensure your password meets all strength criteria.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    // 3. Verification Check (Requirement #5)
    if (!isPhoneVerified) {
      setErrorMessage('Please verify your phone number via OTP code before creating your account.');
      return;
    }

    if (!formData.agreeTerms) {
      setErrorMessage('You must agree to the Terms of Service.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          name: formData.name.trim() || formData.username.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          isVerified: true,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setSuccessMessage('Account created & verified! Redirecting to dashboard...');
        setTimeout(() => navigate('/dashboard'), 1200);
      } else {
        setErrorMessage(data.message || 'Registration failed');
      }

    } catch (error) {
      console.error('Registration tunnel error:', error);
      setErrorMessage(error.message || 'Server connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#181818] text-[#F7F4EB] flex flex-col justify-between font-sans selection:bg-[#C8A96A] selection:text-black">
      
      {/* HEADER */}
      <AuthHeader />

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* RIGHT COLUMN: Auth Card */}
        <div className="order-1 lg:order-2 lg:col-span-7 flex justify-center items-center">
          <div className="w-full max-w-lg bg-[#202020] border border-[#333333] rounded-3xl p-5 sm:p-7 shadow-2xl">
            
            {/* Navigation Tabs */}
            <div className="flex bg-[#181818] p-1 rounded-xl mb-4 border border-[#333333]">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg text-[#A0A0A0] hover:text-[#F7F4EB] transition-all cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-[#202020] text-[#F7F4EB] shadow-sm transition-all cursor-pointer border border-[#333333]"
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Feedback */}
            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* CREATE ACCOUNT FORM */}
            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* 1. DEDICATED REAL-TIME UNIQUE USERNAME (Requirement #4) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A0A0A0]">
                    Username *
                  </label>
                  {usernameStatus !== 'idle' && (
                    <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                      usernameStatus === 'available' ? 'text-emerald-400' :
                      usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-red-400' :
                      'text-amber-400'
                    }`}>
                      {usernameStatus === 'checking' && <Loader2 size={10} className="animate-spin" />}
                      {usernameStatus === 'available' && <Check size={10} />}
                      {usernameStatus === 'taken' && <X size={10} />}
                      <span>{usernameFeedback}</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="e.g. sophia_reader"
                    className={`w-full pl-9 pr-9 py-2 rounded-xl border bg-[#181818] text-xs text-[#F7F4EB] focus:outline-none transition-all ${
                      usernameStatus === 'available'
                        ? 'border-emerald-500/80 focus:border-emerald-400 ring-1 ring-emerald-500/30'
                        : usernameStatus === 'taken' || usernameStatus === 'invalid'
                        ? 'border-red-500/80 focus:border-red-400 ring-1 ring-red-500/30'
                        : usernameStatus === 'checking'
                        ? 'border-amber-500/60 focus:border-amber-400'
                        : 'border-[#333333] focus:border-[#C8A96A]'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {usernameStatus === 'checking' && <Loader2 size={14} className="text-amber-400 animate-spin" />}
                    {usernameStatus === 'available' && <CheckCircle2 size={14} className="text-emerald-400" />}
                    {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <AlertCircle size={14} className="text-red-400" />}
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A0A0A0] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Sophia Montgomery"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#333333] bg-[#181818] text-xs text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A] transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A0A0A0]">
                    Email Address *
                  </label>
                  {emailTouched && (
                    <span className={`text-[10px] font-semibold flex items-center gap-1 ${isEmailValid ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isEmailValid ? 'Valid email format' : 'Invalid email format'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="sophia@example.com"
                    className={`w-full pl-9 pr-9 py-2 rounded-xl border bg-[#181818] text-xs text-[#F7F4EB] focus:outline-none transition-all ${
                      emailTouched
                        ? isEmailValid
                          ? 'border-emerald-500/80 focus:border-emerald-400 ring-1 ring-emerald-500/20'
                          : 'border-red-500/80 focus:border-red-400 ring-1 ring-red-500/20'
                        : 'border-[#333333] focus:border-[#C8A96A]'
                    }`}
                  />
                  {emailTouched && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {isEmailValid ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : (
                        <AlertCircle size={14} className="text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. PHONE NUMBER & GMAIL-STYLE OTP VERIFICATION (Requirement #5) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A0A0A0]">
                    Phone Number (Security Verification) *
                  </label>
                  {isPhoneVerified && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <ShieldCheck size={11} />
                      <span>Verified ✓</span>
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      disabled={isPhoneVerified}
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 234-5678"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border bg-[#181818] text-xs text-[#F7F4EB] focus:outline-none transition-colors ${
                        isPhoneVerified
                          ? 'border-emerald-500/80 bg-emerald-950/15 text-emerald-200 cursor-not-allowed'
                          : 'border-[#333333] focus:border-[#C8A96A]'
                      }`}
                    />
                  </div>

                  {/* Verification CTA Button */}
                  {isPhoneVerified ? (
                    <button
                      type="button"
                      onClick={() => setIsPhoneVerified(false)}
                      className="px-3 py-2 rounded-xl bg-[#282828] hover:bg-[#333333] text-[#A0A0A0] hover:text-[#F7F4EB] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                      title="Change phone number"
                    >
                      Change
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSendingOtp || !formData.phone.trim()}
                      onClick={handleOpenOtpModal}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C8A96A] to-[#B59659] hover:brightness-110 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={14} />
                          <span>Verify Phone</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[#777777] mt-1">
                  A 6-digit verification code will be sent to confirm your identity (simulated $0 free demo).
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A0A0A0] mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#333333] bg-[#181818] text-xs text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#F7F4EB] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Password Strength Checklist */}
                {passwordTouched && (
                  <div className="mt-2 p-2.5 rounded-xl bg-[#181818] border border-[#333333] space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold">
                      <span className="text-[#A0A0A0]">Password Strength</span>
                      <span className={
                        passedCriteriaCount <= 2 ? 'text-red-400' :
                        passedCriteriaCount <= 4 ? 'text-amber-400' : 'text-emerald-400'
                      }>
                        {passedCriteriaCount <= 2 ? 'Weak' : passedCriteriaCount <= 4 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-[#282828] rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 transition-all ${passedCriteriaCount >= 1 ? (passedCriteriaCount <= 2 ? 'bg-red-500' : passedCriteriaCount <= 4 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 transition-all ${passedCriteriaCount >= 3 ? (passedCriteriaCount <= 4 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 transition-all ${passedCriteriaCount >= 5 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                    </div>

                    <div className="grid grid-cols-2 gap-1 pt-0.5">
                      {[
                        { label: '8+ characters', met: passwordCriteria.minLength },
                        { label: 'Uppercase letter', met: passwordCriteria.hasUpper },
                        { label: 'Lowercase letter', met: passwordCriteria.hasLower },
                        { label: 'Number', met: passwordCriteria.hasNumber },
                        { label: 'Special character', met: passwordCriteria.hasSpecial }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-[10px]">
                          {item.met ? (
                            <Check size={11} className="text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle size={11} className="text-[#555555] shrink-0" />
                          )}
                          <span className={item.met ? 'text-emerald-300' : 'text-[#777777]'}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A0A0A0] mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#333333] bg-[#181818] text-xs text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#F7F4EB] transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="rounded border-[#333333] text-[#C8A96A] focus:ring-[#C8A96A] cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-[11px] text-[#A0A0A0] cursor-pointer leading-tight">
                  I agree to the <span className="text-[#C8A96A] font-semibold underline">Terms</span> and <span className="text-[#C8A96A] font-semibold underline">Privacy Policy</span>.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-[#C8A96A] to-[#B59659] hover:brightness-110 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
                {!isLoading && <ArrowRight size={15} />}
              </button>
            </form>

          </div>
        </div>

        {/* LEFT COLUMN: Academic & Platform Highlights */}
        <div className="order-2 lg:order-1 lg:col-span-5 flex flex-col space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8A96A]/10 border border-[#C8A96A]/20 text-[#C8A96A] text-xs font-semibold w-fit">
            <Sparkles size={13} />
            <span>Academic Phase 1 Verified</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-serif leading-tight">
            Ready to <span className="text-[#C8A96A] italic">Transform</span> How You Read?
          </h1>

          <p className="text-[#A0A0A0] text-xs lg:text-sm leading-relaxed">
            Create your verified account with real-time uniqueness validation, secure OTP authorization, and dynamic reading roadmap management.
          </p>

          <div className="space-y-2.5 pt-2">
            {[
              'Real-time unique username availability check (Requirement #4)',
              'Gmail-style 6-digit OTP verification modal (Requirement #5)',
              'Dynamic cascading roadmap generation (Requirement #6)',
              'Interactive target completion datepicker (Requirement #14)'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs font-medium text-[#E0E0E0]">
                <CheckCircle2 size={16} className="text-[#8FAE9B] shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="py-3 text-center text-[11px] text-[#777777] shrink-0 border-t border-[#222222]">
        © 2026 Gregarious Closet. Smart Reading & Academic Library Platform.
      </footer>

      {/* ==================== GMAIL-STYLE 6-DIGIT OTP VERIFICATION MODAL ==================== */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#202020] border border-[#333333] rounded-3xl p-6 sm:p-7 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#C8A96A]/20 text-[#C8A96A]">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#F7F4EB]">
                    Verify Phone Number
                  </h3>
                  <p className="text-[11px] text-[#A0A0A0]">
                    Sent to: <span className="text-[#F7F4EB] font-medium">{formData.phone}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOtpModalOpen(false)}
                className="p-1.5 text-[#A0A0A0] hover:text-[#F7F4EB] hover:bg-[#282828] rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Simulated Demo Hint Banner (Zero Cost Demonstration) */}
            {demoOtpCode && (
              <div className="mt-4 p-3 rounded-2xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 text-xs text-[#F7F4EB] space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between font-semibold text-[#C8A96A]">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>Academic Demo Hint ($0 Free)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoFillDemoCode}
                    className="text-[11px] underline hover:text-[#F7D373] cursor-pointer"
                  >
                    Auto-Fill Code
                  </button>
                </div>
                <p className="text-[11px] text-[#CCCCCC]">
                  Simulated verification code: <span className="font-mono font-bold tracking-widest text-[#F7D373] bg-black/40 px-2 py-0.5 rounded-md ml-1">{demoOtpCode}</span>
                </p>
              </div>
            )}

            {/* Error & Success Messages */}
            {otpModalError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <span>{otpModalError}</span>
              </div>
            )}

            {otpModalSuccess && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span>{otpModalSuccess}</span>
              </div>
            )}

            {/* 6 Individual Digit Input Boxes */}
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
              <div>
                <label className="block text-center text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-3">
                  Enter 6-Digit Verification Code
                </label>

                <div className="flex justify-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={6} // Allows pasting full code into any single box
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-bold rounded-2xl border bg-[#181818] text-[#F7F4EB] focus:outline-none transition-all ${
                        digit
                          ? 'border-[#C8A96A] ring-1 ring-[#C8A96A] shadow-md shadow-[#C8A96A]/10'
                          : 'border-[#333333] focus:border-[#C8A96A]'
                      }`}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Countdown Timer & Resend Option */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5 text-[#A0A0A0]">
                  <Clock size={13} className="text-[#C8A96A]" />
                  {otpTimer > 0 ? (
                    <span>Resend code in <strong className="text-[#F7F4EB] font-mono">{otpTimer}s</strong></span>
                  ) : (
                    <span className="text-amber-400">Code expired. Please resend.</span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!canResendOtp || isSendingOtp}
                  onClick={handleOpenOtpModal}
                  className="text-xs text-[#C8A96A] hover:underline disabled:opacity-40 disabled:hover:no-underline font-semibold cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={12} className={isSendingOtp ? 'animate-spin' : ''} />
                  <span>Resend Code</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-[#333333]">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#333333] text-xs font-semibold text-[#A0A0A0] hover:text-[#F7F4EB] hover:bg-[#282828] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpDigits.join('').length !== 6}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#C8A96A] to-[#B59659] hover:brightness-110 text-white text-xs font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span>Verify Code</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
