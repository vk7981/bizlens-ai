import React, { useState, useEffect } from 'react';
import FileUploader from '../components/FileUploader';
import Tilt3DCard from '../components/Tilt3DCard';
import { getHistory } from '../api/client';
import { FolderOpen, Eye, Clock, Sparkles } from 'lucide-react';

export default function Home({ onUploadStart, onSelectSession, t, userEmail }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await getHistory();
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to load history list:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleUpload = async (files, email) => {
    onUploadStart(files, email);
  };

  return (
    <div className="space-y-16 py-6 relative">
      {/* Hero Headline Banner */}
      <section className="text-center space-y-5 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 bg-primary-950/45 border border-primary-900/60 rounded-full px-4 py-1.5 text-xs text-primary-300 font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary-400 animate-pulse" />
          <span>Multilingual AI Business Intelligence Assistant</span>
        </div>
        <h1 className="font-extrabold text-slate-100 text-4xl md:text-5xl tracking-tight leading-tight">
          {t('subtitle')}
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          {t('subline')}
        </p>
      </section>

      {/* Main Upload Control Panel wrapped in 3D tilt */}
      <div className="max-w-2xl mx-auto">
        <Tilt3DCard className="bg-surface border border-outline-variant/60 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden glass-panel">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl -z-10" />
          <h2 className="text-slate-100 font-extrabold text-lg mb-6 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary-fixed-dim" />
            {t('uploadTitle')}
          </h2>
          <FileUploader onUpload={handleUpload} isLoading={false} t={t} loggedInEmail={userEmail} />
        </Tilt3DCard>
      </div>

      {/* Explainer Stepper Row wrapped in 3D tilt cards */}
      <section className="space-y-8 max-w-5xl mx-auto">
        <h2 className="text-center font-extrabold text-slate-300 text-xs uppercase tracking-widest">
          {t('howItWorks')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Tilt3DCard className="bg-surface/50 border border-outline-variant/40 rounded-2xl p-6 space-y-3 shadow-lg">
            <h4 className="font-extrabold text-primary-fixed-dim text-sm uppercase tracking-wide">
              {t('step1Title')}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('step1Desc')}
            </p>
          </Tilt3DCard>
          <Tilt3DCard className="bg-surface/50 border border-outline-variant/40 rounded-2xl p-6 space-y-3 shadow-lg">
            <h4 className="font-extrabold text-primary-fixed-dim text-sm uppercase tracking-wide">
              {t('step2Title')}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('step2Desc')}
            </p>
          </Tilt3DCard>
          <Tilt3DCard className="bg-surface/50 border border-outline-variant/40 rounded-2xl p-6 space-y-3 shadow-lg">
            <h4 className="font-extrabold text-primary-fixed-dim text-sm uppercase tracking-wide">
              {t('step3Title')}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('step3Desc')}
            </p>
          </Tilt3DCard>
        </div>
      </section>

      {/* Past Explorations History */}
      <section className="border-t border-outline-variant/60 pt-10 max-w-4xl mx-auto">
        <div className="mb-6">
          <h3 className="font-extrabold text-slate-100 text-lg">
            {t('pastExplorations')}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {t('historyDesc')}
          </p>
        </div>

        {loadingHistory ? (
          <div className="text-center py-8 text-xs text-slate-500 animate-pulse">
            {t('loadingLogs')}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-surface/30 border border-outline-variant/40 rounded-2xl">
            {t('noHistory')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {history.map((sess) => (
              <div key={sess.session_id}>
                <Tilt3DCard className="flex items-center justify-between p-4 bg-surface border border-outline-variant/80 hover:border-primary-500/40 rounded-2xl shadow-lg transition-all group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center shrink-0 border border-slate-900">
                      <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-200 truncate leading-none mb-1.5">
                        {sess.db_name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                          sess.status === 'COMPLETED'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40'
                            : sess.status === 'FAILED'
                              ? 'bg-red-950/60 text-red-400 border border-red-900/40'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-900/40 pulse-soft'
                        }`}>
                          {sess.status}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(sess.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onSelectSession(sess.session_id, sess.db_name, sess.status)}
                    className="px-4 py-2 text-xs font-extrabold bg-slate-950/60 text-slate-300 group-hover:bg-primary-700 group-hover:text-white border border-slate-900 group-hover:border-primary-700 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('resumeBtn')}</span>
                  </button>
                </Tilt3DCard>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
