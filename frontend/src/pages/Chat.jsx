import React from 'react';
import ChatWindow from '../components/ChatWindow';
import { ArrowLeft, MessageSquare } from 'lucide-react';

export default function Chat({ sessionId, dbName, onBack, currentLang, t }) {
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
        <span className="text-xs text-slate-400 font-medium">
          Chatting with: <strong className="text-slate-200">{dbName}</strong>
        </span>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-6 h-6 text-indigo-400" />
          <h2 className="text-slate-100 font-extrabold text-xl">
            {t('chatTitle')}
          </h2>
        </div>
        
        {/* Chat Component */}
        <ChatWindow 
          sessionId={sessionId} 
          currentLang={currentLang} 
          t={t} 
        />
      </div>
    </div>
  );
}
