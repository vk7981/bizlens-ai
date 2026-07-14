import React, { useState } from 'react';
import { loginUser } from '../api/client';
import Tilt3DCard from '../components/Tilt3DCard';
import { Mail, Lock, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export default function Login({ onLoginSuccess, onToggleRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError(null);
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

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-200 flex flex-col items-center justify-center bg-grid-pattern relative overflow-hidden px-4">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] radial-glow-indigo pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] radial-glow-orange pointer-events-none -z-10" />

      <div className="w-full max-w-md">
        <Tilt3DCard className="bg-surface border border-outline-variant/65 rounded-3xl p-6 md:p-8 shadow-2xl glass-panel relative overflow-hidden">
          {/* Top Brand Marker */}
          <div className="flex flex-col items-center text-center mb-8">
            <img 
              src="/logo.png" 
              alt="BizLens AI Logo" 
              className="h-16 w-auto object-contain select-none"
            />
          </div>

          {error && (
            <div className="bg-red-950/60 border border-red-900/40 text-red-300 text-xs px-4 py-3 rounded-lg flex items-center gap-2 mb-6 animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-xs text-slate-100 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-xs text-slate-100 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-650/15 cursor-pointer transition-all flex items-center justify-center gap-2 mt-2"
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

          {/* Toggle link to Register */}
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
