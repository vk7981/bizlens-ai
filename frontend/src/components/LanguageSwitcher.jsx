import React from 'react';

export default function LanguageSwitcher({ currentLang, onChange }) {
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'te', label: 'తెలుగు' }
  ];

  return (
    <div className="flex bg-slate-950/60 p-1 rounded-lg border border-slate-800/80 shadow-md">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onChange(lang.code)}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            currentLang === lang.code
              ? 'bg-slate-900 text-slate-100 shadow-sm border border-slate-800/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
