import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import AlertSettings from './pages/AlertSettings';
import Login from './pages/Login';
import Register from './pages/Register';
import LanguageSwitcher from './components/LanguageSwitcher';
import AgentProgressBar from './components/AgentProgressBar';
import { translations } from './api/translations';
import { uploadFiles, runAgent } from './api/client';
import { Sparkles, HelpCircle, ShieldAlert } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('vantage_lang') || 'en');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('vantage_user_email') || '');
  const [authScreen, setAuthScreen] = useState('login');
  const [screen, setScreen] = useState('home'); // home, agent, dashboard, chat, settings
  const [sessionId, setSessionId] = useState(null);
  const [dbName, setDbName] = useState('');
  
  // Running agent state
  const [agentProgress, setAgentProgress] = useState({ phase: 'SCHEMA', percent: 5, message: 'Warming up...' });
  const [agentLogs, setAgentLogs] = useState([]);
  const [queriesCount, setQueriesCount] = useState(0);
  const [insightsCount, setInsightsCount] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    localStorage.setItem('vantage_lang', lang);
  }, [lang]);

  // Translation helper function
  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  const handleUploadStart = async (files, email) => {
    setUploadingFiles(true);
    try {
      const emailToUse = userEmail || email;
      const res = await uploadFiles(files, emailToUse);
      setSessionId(res.data.session_id);
      setDbName(res.data.db_name);
      
      // Start analysis process
      setScreen('agent');
      setAgentProgress({ phase: 'SCHEMA', percent: 5, message: 'Warming up engine...' });
      setAgentLogs([]);
      setQueriesCount(0);
      setInsightsCount(0);
      
      // Trigger execution
      triggerAgent(res.data.session_id);
    } catch (err) {
      alert(err.response?.data?.detail || "Upload process failed.");
    } finally {
      setUploadingFiles(false);
    }
  };

  const triggerAgent = async (sessId) => {
    try {
      await runAgent(sessId);
      
      // Open SSE Connection
      const sseUrl = `http://localhost:8000/api/agent/stream/${sessId}`;
      const source = new EventSource(sseUrl);
      
      source.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          setAgentProgress({
            phase: data.phase,
            percent: data.percent,
            message: data.message
          });
        } else if (data.type === 'log') {
          setAgentLogs((prev) => [...prev, {
            sender: data.sender,
            message: data.message
          }]);
        } else if (data.type === 'sql_run') {
          setQueriesCount((c) => c + 1);
          setAgentLogs((prev) => [...prev, {
            sender: 'sql',
            message: data.query
          }]);
        } else if (data.type === 'insight_found') {
          setInsightsCount((c) => c + 1);
          setAgentLogs((prev) => [...prev, {
            sender: 'agent',
            message: `🎉 Insight Discovered: '${data.insight.title}'`
          }]);
        } else if (data.type === 'complete') {
          source.close();
          setTimeout(() => {
            setScreen('dashboard');
          }, 1500);
        } else if (data.type === 'error') {
          source.close();
          alert(data.message);
          setScreen('home');
        }
      };
      
      source.onerror = () => {
        source.close();
      };
    } catch (err) {
      alert("Failed to connect to AI analysis stream.");
      setScreen('home');
    }
  };

  const handleSelectSession = (sessId, name, status) => {
    setSessionId(sessId);
    setDbName(name);
    if (status === 'COMPLETED') {
      setScreen('dashboard');
    } else {
      setScreen('agent');
      triggerAgent(sessId);
    }
  };

  if (!userEmail) {
    if (authScreen === 'register') {
      return (
        <Register 
          onRegisterSuccess={(email) => {
            setUserEmail(email);
            localStorage.setItem('vantage_user_email', email);
          }}
          onToggleLogin={() => setAuthScreen('login')}
        />
      );
    }
    return (
      <Login 
        onLoginSuccess={(email) => {
          setUserEmail(email);
          localStorage.setItem('vantage_user_email', email);
        }} 
        onToggleRegister={() => setAuthScreen('register')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-200 flex flex-col bg-grid-pattern relative overflow-x-hidden">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] radial-glow-indigo pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] radial-glow-orange pointer-events-none -z-10" />

      {/* Premium Navigation Header */}
      <header className="bg-surface-container-low/75 border-b border-outline-variant/60 sticky top-0 z-50 shadow-lg backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div 
            onClick={() => setScreen('home')}
            className="flex items-center cursor-pointer group select-none"
          >
            <img 
              src="/logo.png" 
              alt="VantageBI Logo" 
              className="h-14 w-auto object-contain group-hover:scale-[1.02] transition-all"
            />
          </div>
          
          <div className="flex items-center gap-4">
            {/* Top Language Toggle Switcher */}
            <LanguageSwitcher currentLang={lang} onChange={setLang} />
            
            {/* Logged in User Profile Info */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <span className="text-xs text-slate-300 font-medium hidden md:inline">
                {userEmail}
              </span>
              <button
                onClick={() => {
                  setUserEmail('');
                  localStorage.removeItem('vantage_user_email');
                  setScreen('home');
                }}
                className="px-2.5 py-1.5 text-[10px] font-bold text-red-400 bg-red-950/20 hover:bg-red-950/40 border border-red-900/35 rounded-lg hover:border-red-900/50 transition-all cursor-pointer select-none"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 relative">
        {screen === 'home' && (
          <Home 
            onUploadStart={handleUploadStart} 
            onSelectSession={handleSelectSession} 
            t={t} 
            userEmail={userEmail}
          />
        )}
        
        {screen === 'agent' && (
          <div className="max-w-3xl mx-auto py-12 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-extrabold text-slate-100 flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-700"></span>
                </span>
                Analyzing {dbName}...
              </h2>
              <p className="text-xs text-slate-400">
                Please wait while our agent reads schemas, writes SELECT queries, and compiles insights.
              </p>
            </div>
            <AgentProgressBar 
              progress={agentProgress} 
              logs={agentLogs} 
              queriesCount={queriesCount} 
              insightsCount={insightsCount} 
              t={t} 
            />
          </div>
        )}
        
        {screen === 'dashboard' && (
          <Dashboard 
            sessionId={sessionId} 
            dbName={dbName} 
            onBack={() => setScreen('home')} 
            onOpenChat={() => setScreen('chat')}
            onOpenSettings={() => setScreen('settings')}
            t={t} 
            userEmail={userEmail}
          />
        )}
        
        {screen === 'chat' && (
          <Chat 
            sessionId={sessionId} 
            dbName={dbName} 
            onBack={() => setScreen('dashboard')} 
            currentLang={lang} 
            t={t} 
          />
        )}
        
        {screen === 'settings' && (
          <AlertSettings 
            sessionId={sessionId} 
            onBack={() => setScreen('dashboard')} 
            t={t} 
          />
        )}
      </main>

      {/* Approachable and clean Footer */}
      <footer className="bg-surface-container-low/40 border-t border-outline-variant/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} VantageBI. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase">
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
            <span>Select-Only Sandbox Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
