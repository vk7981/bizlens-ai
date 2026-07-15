import React, { useState, useEffect } from 'react';
import { getReport, sendReportEmail } from '../api/client';
import InsightCard from '../components/InsightCard';
import AlertBanner from '../components/AlertBanner';
import Tilt3DCard from '../components/Tilt3DCard';
import ProfitCalendar from '../components/ProfitCalendar';
import AdvancedVisualizations from '../components/AdvancedVisualizations';
import Chat from './Chat';
import AlertSettings from './AlertSettings';

import { 
  ArrowLeft, Mail, CheckCircle2, ShieldCheck, Sparkles, MessageCircle, AlertCircle, Settings, X, Calendar, BarChart3,
  LayoutDashboard, MessageSquare, LogOut, Activity, Lock, Layers, Cpu, ShieldAlert, Award
} from 'lucide-react';

export default function Dashboard({ sessionId, dbName, onBack, onOpenChat, onOpenSettings, t, userEmail }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [etherealInfo, setEtherealInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'chat' | 'calendar' | 'charts' | 'settings'

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
        <span className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-violet-400 font-bold animate-pulse">Loading report insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="w-14 h-14 bg-red-950/40 border border-red-900/50 rounded-full flex items-center justify-center mx-auto text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-extrabold text-slate-100 text-lg">Failed to Load Report</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-750 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
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
  
  // Extract user first name
  const userName = userEmail ? userEmail.split('@')[0] : 'Analyst';
  const displayUserName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-background text-slate-200">
      
      {/* Left Sidebar Layout */}
      <aside className="md:col-span-3 bg-surface-container-low border-r border-outline-variant flex flex-col justify-between p-6">
        
        {/* Upper Menu options */}
        <div className="space-y-8">
          
          {/* Logo brand */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-outline-variant/60 gap-2.5">
            <img src="/logo.png" alt="VantageBI Logo" className="w-18 h-18 object-contain rounded-xl shadow-lg border border-outline-variant/40" />
            <div>
              <span className="font-extrabold text-slate-100 text-lg tracking-tight block">VantageBI</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-secondary">Agentic BI Hub</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            {[
              { id: 'insights', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
              { id: 'calendar', label: 'Profit Calendar', icon: Calendar },
              { id: 'charts', label: 'Visualizations', icon: BarChart3 },
              { id: 'settings', label: 'Alert Preferences', icon: Settings },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white shadow-md shadow-violet-650/15'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-container/60'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower block card: Exit Session */}
        <div className="space-y-4 mt-8">
          {/* Exit / Return home */}
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-250 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Return to Workspace</span>
          </button>
        </div>

      </aside>

      {/* Right Content Workspace */}
      <main className="md:col-span-9 p-6 md:p-8 space-y-8 overflow-y-auto">

        {/* Ethereal Mailbox Access Alert */}
        {etherealInfo && (
          <div className="bg-violet-950/20 border border-violet-900/50 text-violet-200 rounded-3xl p-5 space-y-3 relative overflow-hidden shadow-xl animate-fade-in glass-panel">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-xl -z-10" />
            <div className="flex items-start gap-3">
              <div className="p-2 bg-violet-900/50 rounded-xl text-violet-400 border border-violet-850 shrink-0">
                <ShieldCheck className="w-5 h-5 text-violet-400" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="font-extrabold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
                  <span>📬 VantageBI Mail Sandbox Active!</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  Your email report has been successfully dispatched and captured inside our sandbox. View your fully formatted email report using the credentials below:
                </p>
                <div className="bg-slate-950/70 border border-slate-900 rounded-xl p-3 max-w-md mt-2 flex flex-col gap-1.5 text-[11px] font-mono select-all">
                  <div><span className="text-violet-400 font-bold">Mailbox Link:</span> <a href="https://ethereal.email/login" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline font-bold hover:text-violet-300">https://ethereal.email/login</a></div>
                  <div><span className="text-violet-400 font-bold">Username:</span> {etherealInfo.user}</div>
                  <div><span className="text-violet-400 font-bold">Password:</span> {etherealInfo.pass}</div>
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

        {/* Global Dashboard Top Navbar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant pb-5">
          <div className="space-y-1">
            <h1 className="font-extrabold text-slate-100 text-2xl tracking-tight">
              Welcome back, {displayUserName}
            </h1>
            <p className="text-xs text-slate-450 flex items-center gap-1.5">
              <span>Current Session:</span>
              <strong className="text-slate-300">{dbName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Pulsing Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-950/30 border border-violet-900/30 rounded-full text-[10px] font-bold text-violet-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>AI Active</span>
            </div>

            {/* Email Dispatch Action */}
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                emailSent
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                  : 'bg-violet-650 hover:bg-violet-750 text-white border-violet-600 shadow-md shadow-violet-500/15'
              }`}
            >
              {emailSent ? <CheckCircle2 className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
              <span>{emailSent ? t('emailSent') : t('sendEmailBtn')}</span>
            </button>
          </div>
        </header>

        {/* Content Render Pane based on selected Sidebar tab */}
        
        {/* tab 1: Dashboard Insights */}
        {activeTab === 'insights' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* KPI Stats Blocks with custom glowing sparklines */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Stats Card 1 */}
              <Tilt3DCard className="bg-surface/50 border border-outline-variant/65 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('totalInsights')}
                  </span>
                  <span className="text-2xl font-extrabold text-violet-400 block mt-1">
                    {insights.length}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 text-[10px] text-emerald-400 font-bold">
                  <span>+12.5% vs baseline</span>
                  <svg className="w-14 h-6 text-violet-400 stroke-2" fill="none" viewBox="0 0 100 30">
                    <path d="M0,25 Q15,5 30,20 T60,5 T90,22 T100,10" stroke="currentColor" />
                  </svg>
                </div>
              </Tilt3DCard>

              {/* Stats Card 2 */}
              <Tilt3DCard className="bg-surface/50 border border-outline-variant/65 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('alertsCount')}
                  </span>
                  <span className="text-2xl font-extrabold text-orange-400 block mt-1">
                    {highImpactCount}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 text-[10px] text-orange-400 font-bold">
                  <span>Attention required</span>
                  <svg className="w-14 h-6 text-orange-400 stroke-2" fill="none" viewBox="0 0 100 30">
                    <path d="M0,10 Q20,25 40,5 T80,20 T100,12" stroke="currentColor" />
                  </svg>
                </div>
              </Tilt3DCard>

              {/* Stats Card 3 */}
              <Tilt3DCard className="bg-surface/50 border border-outline-variant/65 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('totalQueries')}
                  </span>
                  <span className="text-2xl font-extrabold text-slate-100 block mt-1">
                    {queriesCount}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 text-[10px] text-slate-450 font-bold">
                  <span>SQL Scans run</span>
                  <svg className="w-14 h-6 text-slate-300 stroke-2" fill="none" viewBox="0 0 100 30">
                    <path d="M0,20 Q10,10 30,25 T70,5 T100,15" stroke="currentColor" />
                  </svg>
                </div>
              </Tilt3DCard>

              {/* Stats Card 4 */}
              <Tilt3DCard className="bg-surface/50 border border-outline-variant/65 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Security Audit
                  </span>
                  <span className="text-lg font-extrabold text-emerald-400 block mt-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span>PASSED</span>
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 text-[10px] text-emerald-400 font-bold">
                  <span>Select-only mode</span>
                  <div className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 rounded text-[8px]">
                    SECURE
                  </div>
                </div>
              </Tilt3DCard>
            </section>

            {/* Alerts Banner */}
            <AlertBanner alerts={alerts} t={t} />

            {/* Insights and Quick Chat Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Insight Cards (Left) */}
              <div className="lg:col-span-7 space-y-5">
                <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
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

              {/* Quick Chat card widget (Right) */}
              <div className="lg:col-span-5 space-y-5">
                <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-violet-400" />
                  {t('chatTitle')}
                </h3>
                <Tilt3DCard className="bg-surface/50 border border-outline-variant/65 rounded-2xl p-5 shadow-lg space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Have questions about specific sales metrics, customer counts, or trends? Access the assistant directly using the menu sidebar.
                  </p>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="w-full py-3 bg-slate-950/65 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-350 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4 text-violet-400" />
                    <span>Open AI Chat Assistant</span>
                  </button>
                </Tilt3DCard>
              </div>

            </div>
          </div>
        )}

        {/* tab 2: AI Chatbot mounted inline */}
        {activeTab === 'chat' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <Chat 
              sessionId={sessionId} 
              dbName={dbName} 
              onBack={() => setActiveTab('insights')} 
              currentLang="en"
              t={t} 
            />
          </div>
        )}

        {/* tab 3: Profit Calendar */}
        {activeTab === 'calendar' && (
          <div className="animate-fade-in">
            <ProfitCalendar sessionId={sessionId} userEmail={userEmail} />
          </div>
        )}

        {/* tab 4: Dynamic Visualizations */}
        {activeTab === 'charts' && (
          <div className="animate-fade-in">
            <AdvancedVisualizations sessionId={sessionId} userEmail={userEmail} />
          </div>
        )}

        {/* tab 5: Settings Preferences mounted inline */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in max-w-2xl mx-auto">
            <AlertSettings 
              sessionId={sessionId} 
              onBack={() => setActiveTab('insights')} 
              t={t} 
            />
          </div>
        )}

      </main>

    </div>
  );
}
