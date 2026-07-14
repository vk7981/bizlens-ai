import React, { useState, useEffect } from 'react';
import { configureAlerts, getSessionInfo } from '../api/client';
import { ArrowLeft, Save, CheckCircle2, AlertCircle, Settings } from 'lucide-react';

export default function AlertSettings({ sessionId, onBack, t }) {
  const [email, setEmail] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [reportsEnabled, setReportsEnabled] = useState(true);
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sessionId) {
      loadSettings();
    }
  }, [sessionId]);

  const loadSettings = async () => {
    try {
      const res = await getSessionInfo(sessionId);
      setEmail(res.data.email || '');
      setAlertsEnabled(res.data.alerts_enabled);
      setReportsEnabled(res.data.reports_enabled);
    } catch (err) {
      console.error("Failed to load settings details:", err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setSaving(true);
    setSaved(false);

    try {
      await configureAlerts({
        session_id: sessionId,
        email: email.trim(),
        alerts_enabled: alertsEnabled,
        reports_enabled: reportsEnabled
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError("Failed to save configuration settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="max-w-xl mx-auto bg-surface border border-outline-variant/65 rounded-3xl p-6 md:p-8 shadow-2xl glass-panel space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
          <Settings className="w-5 h-5 text-indigo-400" />
          <h2 className="text-slate-100 font-extrabold text-lg">
            {t('settingsTitle')}
          </h2>
        </div>

        {saved && (
          <div className="bg-emerald-950/60 border border-emerald-900/40 text-emerald-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{t('settingsSaved')}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-950/60 border border-red-900/40 text-red-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Email field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-350 uppercase tracking-wide">
              {t('settingsEmailLabel')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@gmail.com"
              className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/80 transition-all placeholder:text-slate-650"
            />
          </div>

          {/* Toggle Switches */}
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 border-slate-800 bg-slate-900 rounded focus:ring-indigo-500/80 cursor-pointer"
              />
              <span className="text-xs text-slate-400 leading-normal select-none">
                {t('alertToggleLabel')}
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reportsEnabled}
                onChange={(e) => setReportsEnabled(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 border-slate-800 bg-slate-900 rounded focus:ring-indigo-500/80 cursor-pointer"
              />
              <span className="text-xs text-slate-400 leading-normal select-none">
                {t('reportToggleLabel')}
              </span>
            </label>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 px-6 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-650/15 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : t('saveSettingsBtn')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
