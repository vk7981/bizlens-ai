import React, { useState } from 'react';
import { loginUser, forgotPassword, verifyOtp, resetPassword } from '../api/client';
import Tilt3DCard from '../components/Tilt3DCard';
import { Mail, Lock, ShieldCheck, AlertCircle, Eye, EyeOff, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';

export default function Login({ onLoginSuccess, onToggleRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Recovery views: 'login' | 'forgot_email' | 'forgot_otp' | 'forgot_new_pwd'
  const [view, setView] = useState('login');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [etherealInfo, setEtherealInfo] = useState(null);
  const [mockOtp, setMockOtp] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await loginUser(email, password);
      if (res.data.status === "SUCCESS") {
        onLoginSuccess(res.data.email);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setSuccessMsg(null);
    setEtherealInfo(null);
    setMockOtp(null);
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      if (res.data.status === "SUCCESS") {
        setSuccessMsg(res.data.message);
        if (res.data.ethereal_info) {
          setEtherealInfo(res.data.ethereal_info);
        }
        if (res.data.mock_otp) {
          setMockOtp(res.data.mock_otp);
        }
        setView('forgot_otp');
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to request OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await verifyOtp(email, otp);
      if (res.data.status === "SUCCESS") {
        setSuccessMsg(res.data.message);
        setView('forgot_new_pwd');
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid OTP verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await resetPassword(email, otp, newPassword);
      if (res.data.status === "SUCCESS") {
        setSuccessMsg("Password reset successfully! Please log in with your new password.");
        setView('login');
        setPassword('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setEtherealInfo(null);
        setMockOtp(null);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-200 flex flex-col items-center justify-center bg-grid-pattern relative overflow-hidden px-4">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] radial-glow-indigo pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] radial-glow-orange pointer-events-none -z-10" />

      <div className="w-full max-w-md animate-fade-in">
        <Tilt3DCard className="bg-surface border border-outline-variant/65 rounded-3xl p-6 md:p-8 shadow-2xl glass-panel relative overflow-hidden">
          
          {/* Top Brand Marker */}
          <div className="flex flex-col items-center text-center mb-6">
            <img 
              src="/logo.png" 
              alt="VantageBI Logo" 
              className="h-24 w-auto object-contain select-none"
            />
          </div>

          {/* Feedback panels */}
          {error && (
            <div className="bg-red-950/60 border border-red-900/40 text-red-300 text-xs px-4 py-3 rounded-lg flex items-center gap-2 mb-5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/60 border border-emerald-900/40 text-emerald-300 text-xs px-4 py-3 rounded-lg flex items-center gap-2 mb-5">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sandbox Mock OTP Display */}
          {mockOtp && (
            <div className="bg-blue-950/60 border border-blue-900/45 text-blue-300 text-xs p-4 rounded-xl mb-5 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-blue-400">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Development Mode Active</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                No SMTP server is configured. You can use this sandbox recovery OTP to change your password:
              </p>
              <div className="font-mono text-center text-lg font-bold bg-slate-900 border border-slate-800 py-1.5 rounded-lg select-all text-sky-400 tracking-wider">
                {mockOtp}
              </div>
            </div>
          )}

          {/* Sandbox Ethereal Mail Credentials Display */}
          {etherealInfo && (
            <div className="bg-amber-950/60 border border-amber-900/45 text-amber-300 text-xs p-4 rounded-xl mb-5 space-y-2">
              <div className="font-bold text-amber-400">📬 Ethereal Sandbox Mail Sent</div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Email sent using the Ethereal sandbox SMTP. Login details to check the inbox online:
              </p>
              <div className="bg-slate-900 border border-slate-850 p-2 rounded-lg font-mono text-[10px] text-slate-300 space-y-1">
                <div><strong>User:</strong> {etherealInfo.user}</div>
                <div><strong>Pass:</strong> {etherealInfo.pass}</div>
              </div>
              <a 
                href="https://ethereal.email" 
                target="_blank" 
                rel="noreferrer"
                className="block text-center bg-amber-600 hover:bg-amber-700 font-bold text-white py-1.5 rounded-lg transition-all text-[10px]"
              >
                Go to Ethereal Inbox
              </a>
            </div>
          )}

          {/* ==================================== */}
          {/* VIEW: LOGIN FORM                     */}
          {/* ==================================== */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@company.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setView('forgot_email')}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-100 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-650/15 cursor-pointer transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Access Dashboard</span>
                )}
              </button>
            </form>
          )}

          {/* ==================================== */}
          {/* VIEW: FORGOT PASSWORD (EMAIL INPUT)  */}
          {/* ==================================== */}
          {view === 'forgot_email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-center mb-4">
                <h4 className="text-sm font-bold text-slate-200">Account Password Reset</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter your email address to receive a 6-digit verification code.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@company.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="flex-1 py-3 px-4 text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3 px-4 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending...' : 'Send OTP Code'}
                </button>
              </div>
            </form>
          )}

          {/* ==================================== */}
          {/* VIEW: VERIFY OTP (ENTER CODE)        */}
          {/* ==================================== */}
          {view === 'forgot_otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-4">
                <h4 className="text-sm font-bold text-slate-200">Enter Verification Code</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter the 6-digit verification code sent to <strong>{email}</strong>.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Verification Code (OTP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-center font-mono font-bold tracking-[6px] text-slate-100 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setView('forgot_email')}
                  className="flex-1 py-3 px-4 text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Resend</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3 px-4 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          )}

          {/* ==================================== */}
          {/* VIEW: SET NEW PASSWORD               */}
          {/* ==================================== */}
          {view === 'forgot_new_pwd' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center mb-4">
                <h4 className="text-sm font-bold text-slate-200">Set New Password</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Choose a secure password for your VantageBI account.
                </p>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-100 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-100 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Changing Password...' : 'Reset & Save Password'}
              </button>
            </form>
          )}

          {/* Toggle link to Register */}
          {view === 'login' && (
            <div className="mt-5 text-center text-xs text-slate-400">
              <span>New owner? </span>
              <button
                type="button"
                onClick={onToggleRegister}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
              >
                Register here
              </button>
            </div>
          )}

          {/* Secure sandbox footer */}
          <div className="mt-6 border-t border-slate-900 pt-4 flex items-center justify-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Select-Only Sandbox</span>
          </div>
        </Tilt3DCard>
      </div>
    </div>
  );
}
