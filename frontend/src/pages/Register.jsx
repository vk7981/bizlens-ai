import React, { useState } from 'react';
import { registerUser } from '../api/client';
import Tilt3DCard from '../components/Tilt3DCard';
import { User, Mail, Lock, ShieldCheck, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function Register({ onRegisterSuccess, onToggleLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      const res = await registerUser(name, email, password);
      if (res.data.status === "SUCCESS") {
        onRegisterSuccess(res.data.email);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-200 flex flex-col items-center justify-center bg-grid-pattern relative overflow-hidden px-4">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] radial-glow-indigo pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] radial-glow-orange pointer-events-none -z-10" />

      <div className="w-full max-w-md">
        <Tilt3DCard className="bg-surface border border-outline-variant/65 rounded-3xl p-6 md:p-8 shadow-2xl glass-panel relative overflow-hidden">
          {/* Top Brand Marker */}
          <div className="flex flex-col items-center text-center mb-6">
            <img 
              src="/logo.png" 
              alt="VantageBI Logo" 
              className="h-28 w-auto object-contain select-none"
            />
          </div>

          {error && (
            <div className="bg-red-950/60 border border-red-900/40 text-red-300 text-xs px-4 py-3 rounded-lg flex items-center gap-2 mb-4 animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Owner Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
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

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
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

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Confirm Password
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-650/15 cursor-pointer transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register & Login</span>
              )}
            </button>
          </form>

          {/* Toggle link to Login */}
          <div className="mt-5 text-center text-xs text-slate-400">
            <span>Already registered? </span>
            <button
              type="button"
              onClick={onToggleLogin}
              className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
            >
              Login here
            </button>
          </div>

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
