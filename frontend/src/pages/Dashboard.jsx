import React, { useState, useEffect } from 'react';
import { getReport, sendReportEmail } from '../api/client';
import InsightCard from '../components/InsightCard';
import AlertBanner from '../components/AlertBanner';
import Tilt3DCard from '../components/Tilt3DCard';
import { ArrowLeft, Mail, CheckCircle2, ShieldCheck, Sparkles, MessageCircle, AlertCircle, Settings, X } from 'lucide-react';

export default function Dashboard({ sessionId, dbName, onBack, onOpenChat, onOpenSettings, t, userEmail }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [etherealInfo, setEtherealInfo] = useState(null);

  useEffect(() => {
    if (sessionId) {
      fetchReport();
    }
  }, [sessionId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getReport(sessionId);
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load insight report.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (sendingEmail) return;
    setSendingEmail(true);
    setEmailSent(false);
    
    try {
      const res = await sendReportEmail(sessionId, userEmail);
      if (res.data.sender_type === 'ethereal') {
        setEtherealInfo({
          user: res.data.ethereal_user,
          pass: res.data.ethereal_pass
        });
      } else {
        setEtherealInfo(null);
      }
      setEmailSent(true);
      if (res.data.sender_type !== 'ethereal') {
        setTimeout(() => setEmailSent(false), 5000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Please check alert settings to ensure your email is saved.";
      alert(`Failed to send report:\n${errorMsg}`);
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <span className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-bold animate-pulse">Loading report insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="w-14 h-14 bg-red-950 border border-red-900/50 rounded-full flex items-center justify-center mx-auto text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-extrabold text-slate-100 text-lg">Failed to Load Report</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
        >
          {t('backBtn')}
        </button>
      </div>
    );
  }

  const insights = report?.insights || [];
  const alerts = report?.alerts || [];
  const queriesCount = report?.queries_run || 0;
  
  const highImpactCount = insights.filter(i => i.rank === 'HIGH IMPACT').length + alerts.filter(a => a.severity === 'HIGH').length;

  return (
    <div className="space-y-8 py-6">
      {/* Ethereal Mailbox Access Alert */}
      {etherealInfo && (
        <div className="bg-indigo-950/40 border border-indigo-900/60 text-indigo-200 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-xl animate-fade-in">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -z-10" />
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-900/50 rounded-xl text-indigo-400 border border-indigo-850 shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="font-extrabold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
                <span>📬 Kestrel AI Mail Sandbox Active!</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                Your email report has been successfully dispatched and captured inside our sandbox. You do not need to configure SMTP settings! View your fully formatted email report using the credentials below:
              </p>
              <div className="bg-slate-950/70 border border-slate-900 rounded-xl p-3 max-w-md mt-2 flex flex-col gap-1.5 text-[11px] font-mono select-all">
                <div><span className="text-indigo-400 font-bold">Mailbox Link:</span> <a href="https://ethereal.email/login" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-bold hover:text-emerald-300">https://ethereal.email/login</a></div>
                <div><span className="text-indigo-400 font-bold">Username:</span> {etherealInfo.user}</div>
                <div><span className="text-indigo-400 font-bold">Password:</span> {etherealInfo.pass}</div>
              </div>
            </div>
            <button 
              onClick={() => setEtherealInfo(null)}
              className="text-slate-500 hover:text-slate-350 p-1.5 rounded-lg hover:bg-slate-900/60 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/50 pb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backBtn')}</span>
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={onOpenSettings}
            className="px-4 py-2 text-xs font-extrabold text-slate-300 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4" />
            <span>{t('settingsTitle')}</span>
          </button>
          
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              emailSent
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/40'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-lg shadow-indigo-650/15'
            }`}
          >
            {emailSent ? <CheckCircle2 className="w-4 h-4 animate-pulse" /> : <Mail className="w-4 h-4" />}
            <span>{emailSent ? t('emailSent') : t('sendEmailBtn')}</span>
          </button>
        </div>
      </div>

      {/* Main Title Section */}
      <div className="space-y-2">
        <h1 className="font-extrabold text-slate-100 text-2xl md:text-3xl tracking-tight">
          {t('dashboardTitle')}
        </h1>
        <p className="text-xs text-slate-400">
          {t('filesAnalyzed')}: <span className="font-semibold text-slate-200">{dbName}</span>
        </p>
      </div>

      {/* KPI Stats Blocks with 3D tilting animation */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tilt3DCard className="bg-surface/50 border border-outline-variant/65 rounded-2xl p-4 md:p-5 shadow-lg text-center">
          <span className="text-2xl font-extrabold text-indigo-400 block mb-1">
            {insights.length}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {t('totalInsights')}
          </span>
        </Tilt3DCard>
        <Tilt3DCard className="bg-surface/50 border border-outline-variant/65 rounded-2xl p-4 md:p-5 shadow-lg text-center">
          <span className="text-2xl font-extrabold text-orange-400 block mb-1">
            {highImpactCount}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {t('alertsCount')}
          </span>
        </Tilt3DCard>
        <Tilt3DCard className="bg-surface/50 border border-outline-variant/65 rounded-2xl p-4 md:p-5 shadow-lg text-center">
          <span className="text-2xl font-extrabold text-slate-100 block mb-1">
            {queriesCount}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {t('totalQueries')}
          </span>
        </Tilt3DCard>
        <Tilt3DCard className="bg-surface/50 border border-outline-variant/65 rounded-2xl p-4 md:p-5 shadow-lg text-center flex flex-col justify-center items-center">
          <div className="flex items-center gap-1 text-emerald-400 font-extrabold text-sm mb-1">
            <ShieldCheck className="w-5 h-5" />
            <span>Passed</span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {t('securityAudit')}
          </span>
        </Tilt3DCard>
      </section>

      {/* Alerts Banner */}
      <AlertBanner alerts={alerts} t={t} />

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Side: Insight Cards with 3D tilting scroll animation wrapper */}
        <div className="md:col-span-7 space-y-5">
          <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            {t('insightHeader')}
          </h3>
          <div className="space-y-4">
            {insights.map((ins, idx) => (
              <div key={idx}>
                <Tilt3DCard>
                  <InsightCard insight={ins} t={t} />
                </Tilt3DCard>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Quick Ask/Chat widget with 3D scrolling container */}
        <div className="md:col-span-5 space-y-5">
          <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-400" />
            {t('chatTitle')}
          </h3>
          <Tilt3DCard className="bg-surface/50 border border-outline-variant/65 rounded-2xl p-5 shadow-lg space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Have questions about Chennai customer counts, top category spend, or specific sales peaks? Ask the virtual assistant in English, Tamil, or Hindi.
            </p>
            <button
              onClick={onOpenChat}
              className="w-full py-3 bg-slate-950/65 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4 text-indigo-400" />
              <span>Ask a question</span>
            </button>
          </Tilt3DCard>
        </div>
      </div>
    </div>
  );
}
